let tracked = new Map();

export function doMoveAnimation(first, last, node, id = null) {
    let firstLeft = first.left;
    let firstTop = first.top;
    let lastLeft = last.left;
    let lastTop = last.top;

    if (id != null && tracked.has(id)) {
        let trackedObj = tracked.get(id);
        trackedObj.animation.pause();
        let animPauseTime = trackedObj.animation.currentTime;

        let origDeltaX = trackedObj.firstLeft - trackedObj.lastLeft;
        let origDeltaY = trackedObj.firstTop - trackedObj.lastTop;

        firstLeft = trackedObj.firstLeft + ((animPauseTime / 300) * origDeltaX);
        firstTop = trackedObj.firstTop + ((animPauseTime / 300) * origDeltaY);
    }
    const deltaX = firstLeft - lastLeft;
    const deltaY = firstTop - lastTop;
    // const deltaW = first.width / last.width;
    // const deltaH = first.height / last.height;

    if (Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2)) < 1) return;

    let keyframeEffect = new KeyframeEffect(
        node, 
        [
            {
                transformOrigin: 'top left',
                transform: `translate(${deltaX}px, ${deltaY}px)`
                    // scale(${deltaW}, ${deltaH})
            }, 
            {
                transformOrigin: 'top left',
                transform: 'none'
            }
        ], 
        {
            duration: 300,
            easing: 'linear',
            fill: 'both'
        }
    );

    let animation = new Animation(keyframeEffect, document.timeline);
    if (id != null) {
        tracked.set(id, {
            animation: animation,
            firstLeft: firstLeft,
            firstTop: firstTop,
            lastLeft: lastLeft,
            lastTop: lastTop
        });
    }
    animation.onfinish = () => tracked.delete(id);
    animation.play();
}

let root;

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