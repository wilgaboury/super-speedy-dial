import { doMoveAnimation } from './utils.js';

let rects = new Map();

function Bookmark() {
    let bookmarkNode = null;

    let isSelected = false;

    let rectBeforeUpdate = null;
    let transformRect;

    let hasAddedMouseOver = false;
    let onmouseover = null;

    let index;

    return {
        oncreate: function(vnode) {
            rectBeforeUpdate = vnode.dom.getBoundingClientRect();
        },

        onupdate: function(vnode) {
            if (vnode.attrs.doMoveAnim && rectBeforeUpdate != null) {
                doMoveAnimation(rectBeforeUpdate, vnode.dom.getBoundingClientRect(), vnode.dom, vnode.attrs.key);
            }
            rectBeforeUpdate = vnode.dom.getBoundingClientRect();
        },

        view: function(vnode) {
            bookmarkNode = vnode.attrs.bookmarkNode;

            const onmousedown = vnode.attrs.onmousedown;
            const onmouseup = vnode.attrs.onmouseup;
            onmouseover = vnode.attrs.onmouseover;
            const onmouseout = vnode.attrs.onmouseout;

            const isBeingDragged = vnode.attrs.isBeingDragged;
            const left = vnode.attrs.left;
            const top = vnode.attrs.top;

            index = vnode.attrs.index;

            if (!(vnode.attrs.isSelected == null)) {
                isSelected = vnode.attrs.isSelected;
            }
            if (!(vnode.attrs.transformRect == null)) {
                transformRect = vnode.attrs.transformRect;
            }

            return m('.bookmark-container', {
                    id: `bookmark_${vnode.attrs.key}`,
                    style: isBeingDragged ? `position: absolute; z-index: 1; left: ${left}px; top: ${top}px` : '',
                    onmousedown: function(event) {
                        isSelected = true;
                        onmousedown(event, bookmarkNode, vnode.dom);
                    },
                    onmouseup: function(event) {
                        isSelected = false;
                        onmouseup(event, bookmarkNode);
                        m.redraw();
                    },
                    onmouseover: function(event) {
                        onmouseover(event, bookmarkNode);
                        m.redraw();
                    },
                    onmouseout: function(event) {
                        isSelected = false;
                        onmouseout(event, bookmarkNode);
                        m.redraw();
                    }
                },
                m(".bookmark-card", {style: 'position: relative; ' + (isSelected ? 'border: 2px solid #0390fc' : '')},
                    (bookmarkNode.type == 'folder' ? 
                        m('img.folder-image', {src: 'icons/folder.svg', height: '120'}) : 
                        m('img.website-image', {src: `https://api.statvoo.com/favicon/?url=${encodeURI(bookmarkNode.url)}`, height: '32'})),
                            //`https://www.google.com/s2/favicons?domain=${encodeURI(bookmarkNode.url)}`, height: '32'})),
                    m('.bookmark-cover', {style: 'height: 100%; width: 100%; position: absolute; z-index: 2'}) // required for weird issue involving dragging images
                ),
                m(`.bookmark-title${isSelected ? ' .selected' : ''}`, bookmarkNode.title)
            );
        }
    }
};

export default Bookmark;