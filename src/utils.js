export function doMoveAnimation(first, last, node) {
    const deltaX = first.left - last.left;
    const deltaY = first.top - last.top;
    const deltaW = first.width / last.width;
    const deltaH = first.height / last.height;

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
        duration: 250,
        easing: 'ease-in-out',
        fill: 'both'
    });
}