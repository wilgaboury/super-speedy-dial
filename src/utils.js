let tracked = new Map();

//Deprecated -- I don't think this is used anywhere anymore
// export function doMoveAnimation(first, last, node, id = null) {
//     let firstLeft = first.left;
//     let firstTop = first.top;
//     let lastLeft = last.left;
//     let lastTop = last.top;

//     if (id != null && tracked.has(id)) {
//         let trackedObj = tracked.get(id);
//         trackedObj.animation.pause();
//         let animPauseTime = trackedObj.animation.currentTime;

//         let origDeltaX = trackedObj.firstLeft - trackedObj.lastLeft;
//         let origDeltaY = trackedObj.firstTop - trackedObj.lastTop;

//         firstLeft = trackedObj.firstLeft + ((animPauseTime / 300) * origDeltaX);
//         firstTop = trackedObj.firstTop + ((animPauseTime / 300) * origDeltaY);
//     }
//     const deltaX = firstLeft - lastLeft;
//     const deltaY = firstTop - lastTop;
//     // const deltaW = first.width / last.width;
//     // const deltaH = first.height / last.height;

//     if (Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2)) < 1) return;

//     let keyframeEffect = new KeyframeEffect(
//         node, 
//         [
//             {
//                 transformOrigin: 'top left',
//                 transform: `translate(${deltaX}px, ${deltaY}px)`
//                     // scale(${deltaW}, ${deltaH})
//             }, 
//             {
//                 transformOrigin: 'top left',
//                 transform: 'none'
//             }
//         ], 
//         {
//             duration: 300,
//             easing: 'linear',
//             fill: 'both'
//         }
//     );

//     let animation = new Animation(keyframeEffect, document.timeline);
//     if (id != null) {
//         tracked.set(id, {
//             animation: animation,
//             firstLeft: firstLeft,
//             firstTop: firstTop,
//             lastLeft: lastLeft,
//             lastTop: lastTop
//         });
//     }
//     animation.onfinish = () => tracked.delete(id);
//     animation.play();
// }

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
            // console.log(e);
            console.log('XMLHttpRequest failed at ' + url);
            resolve();
        };
        xhr.onload = function () {
            let images = [];

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
            let favicon = new URL(url).origin + '/favicon.ico';
            images.push(favicon);

            // small favicon
            images.push(`https://api.statvoo.com/favicon/?url=${encodeURI(url)}`);

            resolve(images);
        };
        xhr.open("GET", url);
        xhr.responseType = "document";
        xhr.send();
    });
}

export function filterBadUrls(urls) {
    return new Promise(function(resolve, reject) {
        if (urls.length == 0) {
            resolve([]);
            return;
        }

        let first = urls[0];
        fetch(new Request(first)).then(response => {
            urls.splice(0, 1);
            filterBadUrls(urls).then(newUrls => {
                if (response.status === 200) {
                    let image = new Image();
                    image.onerror = function() {
                        resolve(newUrls);
                    };
                    image.onload = function() {
                        if (this.height >= 96) {
                            newUrls.unshift(first);
                        }
                        resolve(newUrls);
                    };
                } else {
                    resolve(newUrls);
                }
            });
        });
    });
}

//Promise returns blob
export function scaleAndCropImage(url) {
    return new Promise(function(resolve, reject) {
        let img = new Image();
        img.onload = function() {
            if (this.height > 512 || this.width > 512 || this.height != this.width) {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const canvasSize = Math.min(this.height, this.width, 512);
                canvas.width = canvasSize;
                canvas.height = canvasSize;

                const imgSize = Math.min(this.width, this.height);
                const left = (this.width - imgSize) / 2;
                const top = (this.height - imgSize) / 2;

                ctx.drawImage(this, left, top, size, size, 0, 0, canvasSize, canvasSize);
                canvas.toBlob(resolve);
            }
        };
        img.src = url;
    });
}

