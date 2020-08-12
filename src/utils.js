export function doMoveAnimation(first, last, node) {
    const deltaX = first.left - last.left;
    const deltaY = first.top - last.top;
    const deltaW = first.width / last.width;
    const deltaH = first.height / last.height;

    // if (Math.abs(deltaY) < 100 || Math.abs(deltaX) < 100) console.log('less than 100');
    // else console.log('greater than 100');

    node.animate([{
        transformOrigin: 'top left',
        transform: `
            translate(${deltaX}px, ${deltaY}px)
            scale(${deltaW}, ${deltaH})
        `
    }, {
        transformOrigin: 'top left',
        transform: 'none'
    }], {
        duration: 300,
        easing: 'ease-in-out',
        fill: 'both'
    });
}

export function findBookmark(node, id) {
    if (node.id == id) {
        return node;
    }

    if (!(node.children == null)) {
        for (let child of node.children) {
            let temp = findBookmark(child, id);
            if (!(temp == null)) {
                return temp;
            }
        }
    }

    return null;
}