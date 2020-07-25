export function setGridWidth() {
    const bodyWidth = document.querySelector("body").offsetWidth;
    const bookmarkWidth = 240;
    const numPerRow = Math.floor((bodyWidth - 100) / bookmarkWidth);
    document.querySelector(".grid-container").style.width = `${numPerRow * bookmarkWidth}px`;
}

let listenerAdded = false;
export function addWindowResizeListener() {
    if (!listenerAdded) {
        window.addEventListener('resize', setGridWidth);
    }
}