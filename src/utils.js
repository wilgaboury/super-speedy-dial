import { getIDBObject, setIDBObject } from './idb.js';

let root = null;

export function setBookmarkRoot(new_root) {
    root = new_root;
}

export function findBookmark(id) {
    return findBookmarkHelper(root, id);
}

export function findBookmarkHelper(node, id) {
    if (node.id == id) {
        return node;
    }

    if (!(node.children == null)) {
        for (let child of node.children) {
            let temp = findBookmarkHelper(child, id);
            if (!(temp == null)) {
                return temp;
            }
        }
    }

    return null;
}

export function getBookmarkStack(bookmarkId) {
    return new Promise(function(resolve, reject) {
        browser.storage.sync.get('bookmarkRoot', function(bookmarkRoot) {
            browser.bookmarks.getTree().then(root => {
                resolve(getBookmarkStackHelper(findBookmarkHelper(root[0], bookmarkRoot.bookmarkRoot), bookmarkId));
            });
        });
    })
}

function getBookmarkStackHelper(node, searchId) {
    if (node.id == searchId) {
        return [node];
    }
    if (!(node.children == null)) {
        for (let child of node.children) {
            let callResult = getBookmarkStackHelper(child, searchId);
            if (!(callResult == null)) {
                console.log(callResult);
                callResult.unshift(node);
                return callResult;
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
        xhr.onerror = function(e) {
            resolve([`https://api.statvoo.com/favicon/?url=${encodeURI(url)}`]);
        };
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

            let firstImage = xhr.responseXML.querySelector('img[src]');
            if (firstImage) {
                images.push(convertUrlToAbsolute(url, firstImage.getAttribute('src')));
            }

            // get favicon of unknown size
            images.push(`https://api.statvoo.com/favicon/?url=${encodeURI(url)}`);

            resolve(images);
        };
        xhr.open("GET", url);
        xhr.responseType = 'document';
        xhr.send();
    });
}

export function filterBadUrls(urls) {
    return new Promise(function(resolve, reject) {
        if (urls == null || urls.length == 0) {
            resolve([]);
            return;
        }

        let first = urls[0];
        urls.splice(0, 1);

        let xhr = new XMLHttpRequest();
        xhr.onerror = function(e) {
            filterBadUrls(urls).then(resolve);
        };
        xhr.onload = function () {
            if (xhr.readyState == 4 && xhr.status == 200) {
                filterBadUrls(urls).then(result => {
                    result.unshift(first);
                    resolve(result);
                });
            } else {
                filterBadUrls(urls).then(resolve);
            }
        };
        xhr.open("GET", first);
        xhr.send();
    });
}

// Promise returns blob
export function scaleAndCropImage(url) {
    return new Promise(function(resolve, reject) {
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
            .then(result => filterBadUrls(result))
            .then(result => {
                if (!(result == null) && result.length > 0) {
                    scaleAndCropImage(result[0]).then(result => {
                        setIDBObject("bookmark_image_cache", bookmarkNode.id, result.blob);
                        setIDBObject("bookmark_image_cache_sizes", bookmarkNode.id, {width: result.width, height: result.height});
                        resolve(result);
                    });
                } else {
                    resolve(localImageToBlob('icons/web.png'));
                }
            });
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

export function getBookmarkImage(bookmarkNode, retrievingImageCallback = null) {
    return new Promise(function(resolve, reject) {
        if (bookmarkNode.type == 'folder') {
            localImageToBlob('icons/my_folder.png').then(resolve);
        } else if (bookmarkNode.url.substring(bookmarkNode.url.length - 3) == 'pdf') {
            localImageToBlob('icons/pdf.png').then(resolve);  
        } else {
            getIDBObject("bookmark_image_cache", bookmarkNode.id, blob => {
                if (blob == null) {
                    if (retrievingImageCallback != null) retrievingImageCallback();
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

export function getRootFolder() {
    return new Promise(function(resolve, reject) {
        browser.storage.sync.get('bookmarkRoot', function(value) {
            browser.bookmarks.getTree().then(root => {
                setBookmarkRoot(root[0]);
                if (value.bookmarkRoot == null) {
                    resolve(root[0]);
                } else {
                    resolve(findBookmark(value.bookmarkRoot));
                }
            });
        });
    });
}