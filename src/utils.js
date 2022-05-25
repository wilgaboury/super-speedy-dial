import { getIDBObject, setIDBObject } from './idb.js';

export function findBookmarkById(node, id) {
    if (node.id == id) {
        return node;
    }

    if (node.children) {
        for (let child of node.children) {
            let temp = findBookmarkById(child, id);
            if (temp) {
                return temp;
            }
        }
    }

    return null;
}

export function getBookmarkStack(bookmarkId) {
    return new Promise(function(resolve, reject) {
        browser.bookmarks.getTree().then(root => {
            resolve(getBookmarkStackHelper(root[0], bookmarkId) || [root[0]])
        });
    });
}

function getBookmarkStackHelper(node, searchId) {
    if (node.id == searchId) {
        return [node];
    }

    if (node.children) {
        for (let child of node.children) {
            let stack = getBookmarkStackHelper(child, searchId);
            if (stack) {
                stack.unshift(node);
                return stack;
            }
        }
    }

    return null;
}

function convertUrlToAbsolute(origin, path) {
    if (path.indexOf('://') > 0) {
        return path
    } else if (path.indexOf('//') === 0) {
        return 'https:' + path;
    } else {
        let url = new URL(origin);
        if (path.slice(0,1) === "/") {
            return url.origin + path;
        } else {
            if (url.pathname.slice(-1) !== "/") {
                url.pathname = url.pathname + "/";
            }
            return url.origin + url.pathname + path;
        }
    }
}

export function getPageImages(url) {
    return new Promise(function(resolve, reject) {
        let xhr = new XMLHttpRequest();
        xhr.timeout = 2500

        let defaultResolve = function(e) {
            resolve([`https://api.statvoo.com/favicon/?url=${encodeURI(url)}`]);
        };

        xhr.ontimeout = defaultResolve;
        xhr.onerror = defaultResolve;
        xhr.onload = function () {
            let images = [];

            if (xhr.responseXML == null) {
                resolve(null);
                return;
            }

            // get open graph images
            let metas = xhr.responseXML.getElementsByTagName("meta");
            for (let meta of metas) {
                if (meta.getAttribute("property") === "og:image" && meta.getAttribute("content")) {
                    let imageUrl = convertUrlToAbsolute(url, meta.getAttribute("content"));
                    images.push(imageUrl)
                }
            }

            // get large icon
            let sizes = [
                "192x192",
                "180x180",
                "144x144",
                "96x96"
            ];
            for (let size of sizes) {
                let icon = xhr.responseXML.querySelector(`link[rel="icon"][sizes="${size}"]`);
                if (icon) {
                    let imageUrl = convertUrlToAbsolute(url, icon.getAttribute('href'));
                    images.push(imageUrl);
                    break;
                }
            }

            // get apple touch icon
            let appleIcon = xhr.responseXML.querySelector('link[rel="apple-touch-icon"]');
            if (appleIcon) {
                let imageUrl = convertUrlToAbsolute(url, appleIcon.getAttribute('href'));
                images.push(imageUrl);
            }

            // get large favicon
            // let favicon = new URL(url).origin + '/favicon.ico';
            // images.push(favicon);

            // Get First Image on Page
            let imgTags = Array.from(xhr.responseXML.querySelectorAll('img[src]'));
            imgTags.length = Math.min(imgTags.length, 4);
            images.push(...imgTags.map(img => convertUrlToAbsolute(url, img.getAttribute('src'))));

            // get favicon of unknown size
            images.push(`https://api.statvoo.com/favicon/?url=${encodeURI(url)}`);

            resolve(images);
        };
        xhr.open("GET", url);
        xhr.responseType = 'document';
        xhr.send();
    });
}

export function getFirstGoodImageUrl(urls) {
    return new Promise(function(resolve, reject) {
        if (!urls || urls.length <= 0) {
            resolve(null);
        } else {
            let first = urls[0];
            let rest = urls.splice(1);
            let img = new Image();
            let skip = () => getFirstGoodImageUrl(rest).then(resolve);
            img.onload = function(e) {
                if (this.width <= 16 || this.height <= 16) {
                    skip();
                } else {
                    resolve(first);
                }
            };
            img.onerror = skip;
            img.src = first;
        }
    });
}

// Promise returns blob
export function scaleAndCropImageFromUrl(url) {
    return new Promise(function(resolve, reject) {
        if (!url) {
            resolve(null)
        }

        let img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (this.width > 512 || this.height > 512) {
                let scale = Math.max(this.width, this.height) / 512;
                canvas.width = this.width / scale;
                canvas.height = this.height / scale;
            } else {
                canvas.width = this.width;
                canvas.height = this.height;
            }

            ctx.drawImage(this, 0, 0, this.width, this.height, 0, 0, canvas.width, canvas.height);
            canvas.toBlob(blob => {
                resolve({
                    blob: blob, 
                    width: img.width, 
                    height: img.height
                });
            });
        };
        img.onerror = function() {
            resolve(null);
        }
        img.src = url;
    });
}

// returns data uri
export function screenshotUrl(url) {
    return new Promise(function(resolve, reject) {
        browser.tabs.create({ url: url, active: false }).then(tab => {
            browser.tabs.hide(tab.id).then(() => {
                browser.tabs.onUpdated.addListener(() => {
                    browser.tabs.captureTab(tab.id).then(imageUri => {
                        browser.tabs.remove(tab.id).then(() => {
                            resolve(imageUri);
                        });
                    });
                }, { properties: ['status'], tabId: tab.id });
            });
        });
    });
}

export function retrieveBookmarkImage(bookmarkNode) {
    return new Promise(function(resolve, reject) {
        getPageImages(bookmarkNode.url)
        .then(getFirstGoodImageUrl)
        .then(scaleAndCropImageFromUrl)
        .then(img => {
            if (!img) {
                localImageToBlob('icons/web.png')
                .then(img => {
                    setIDBObject("bookmark_image_cache", bookmarkNode.id, img.blob);
                    setIDBObject("bookmark_image_cache_sizes", bookmarkNode.id, {width: img.width, height: img.height});
                    resolve(img);
                });
            } else {
                setIDBObject("bookmark_image_cache", bookmarkNode.id, img.blob);
                setIDBObject("bookmark_image_cache_sizes", bookmarkNode.id, {width: img.width, height: img.height});
                resolve(img);
            }
        })
    });
}

export function localImageToBlob(localPath) {
    return new Promise(function(resolve, reject) {
        let img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(this, 0, 0, img.width, img.height);
            canvas.toBlob(blob => {
                resolve({
                    blob: blob,
                    width: img.width,
                    height: img.height
                });
            });
        };
        img.src = localPath;
    });
}

export function getBookmarkImage(bookmarkNode, loadingStartedCallback = () => {}, force_reload = false) {
    return new Promise(function(resolve, reject) {
        if (bookmarkNode.type == 'folder') {
            localImageToBlob('icons/my_folder.png').then(resolve);
        } else if (bookmarkNode.type == 'separator') {
            localImageToBlob('icons/separator.png').then(resolve);
        } else if (bookmarkNode.url.substring(bookmarkNode.url.length - 3) == 'pdf') {
            localImageToBlob('icons/pdf.png').then(resolve);
        } else {
            getIDBObject("bookmark_image_cache", bookmarkNode.id, blob => {
                if (!blob || force_reload) {
                    loadingStartedCallback();
                    retrieveBookmarkImage(bookmarkNode).then(resolve);
                } else {
                    getIDBObject("bookmark_image_cache_sizes", bookmarkNode.id, sizes => {
                        resolve({
                            blob: blob,
                            width: sizes.width,
                            height: sizes.height
                        });
                    });
                }
            });
        }
    });
}

export function getStartFolder() {
    return new Promise(function(resolve, reject) {
        browser.storage.local.get('bookmarkRoot', function(value) {
            browser.bookmarks.getTree().then(root => {
                let temp = findBookmarkById(root[0], value.bookmarkRoot)
                resolve(temp || root[0]);
            });
        });
    });
}