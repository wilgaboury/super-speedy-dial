import { doMoveAnimation } from './utils.js';

export function setGridWidth() {
    const bodyWidth = document.querySelector('body').offsetWidth;
    const bookmarkWidth = 240;
    const numPerRow = Math.floor((bodyWidth - 100) / bookmarkWidth);
    const styleStr = `${numPerRow * bookmarkWidth}px`;

    if (document.querySelector('.grid').style.width != styleStr) {
        let nodes = Array.from(document.querySelectorAll('.bookmark-container'));
        let firsts = nodes.map(e => e.getBoundingClientRect());

        //only importact line, rest of code in this if is for doing the animation
        document.querySelector('.grid').style.width = styleStr;

        let lasts = nodes.map(e => e.getBoundingClientRect());

        for (let i = 0; i < firsts.length && i < lasts.length && i < nodes.length; i++) {
            let first = firsts[i];
            let last = lasts[i];
            let node = nodes[i];

            doMoveAnimation(first, last, node);
        }
    }
}

let listenerAdded = false;
export function addWindowResizeListener() {
    if (!listenerAdded) {
        window.addEventListener('resize', setGridWidth);
    }
}