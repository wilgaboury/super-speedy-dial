let listenerAdded = false;
export function addWindowResizeListener() {
    if (!listenerAdded) {
        window.addEventListener('resize', function() { m.redraw(); });
    }
}