export function setGridWidth() {
    const bodyWidth = document.querySelector("body").offsetWidth;
    const bookmarkWidth = document.querySelector(".bookmark-container").offsetWidth;
    const numPerRow = Math.floor((bodyWidth - 200) / bookmarkWidth);
    document.querySelector(".grid-container").style.width = `${numPerRow * bookmarkWidth}px`;
}

let listenerAdded = false;
export function addWindowResizeListener() {
    if (!listenerAdded) {
        window.addEventListener('resize', setGridWidth);
    }
}