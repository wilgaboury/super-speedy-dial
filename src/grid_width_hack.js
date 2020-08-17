let listenerAdded = false;
export function addWindowResizeListener() {
    if (!listenerAdded) {
        document.querySelector('body').addEventListener('resize', function() { m.redraw(); });
    }
}