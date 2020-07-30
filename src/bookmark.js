import { doMoveAnimation } from './utils.js';

function Bookmark() {
    let isSelected = false;

    let first;
    let last;

    let domNode;

    return {
        getBoundingClientRect() {
            return domNode.getBoundingClientRect();
        },

        onbeforeupdate: function(newVnode, oldVnode) {
            first = oldVnode.dom.getBoundingClientRect();
        },

        onupdate: function(vnode) {
            last = vnode.dom.getBoundingClientRect();

            doMoveAnimation(first, last, vnode.dom);
        },

        view: function(vnode) {
            domNode = vnode.dom;
            const bookmarkNode = vnode.attrs.bookmarkNode;
            const onmousedown = vnode.attrs.onmousedown;
            const onmouseup = vnode.attrs.onmouseup;
            const onmouseover = vnode.attrs.onmouseover;
            const onmouseout = vnode.attrs.onmouseout;
            const left = vnode.attrs.left;
            const top = vnode.attrs.top;

            if (!(vnode.attrs.isSelected == null)) {
                isSelected = vnode.attrs.isSelected;
            }

            return m(".bookmark-container", {
                    style: vnode.attrs.isBeingDragged ? `position: absolute; z-index: 1; left: ${left}px; top: ${top}px` : '',
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
                        m('img.folder-image', {src: 'icons/folder.svg', height: '120', draggable: 'false'}) : 
                        m('img.website-image', {src: `https://www.google.com/s2/favicons?domain=${encodeURI(bookmarkNode.url)}`, height: '32', draggable: 'false'})),
                    m('.bookmark-cover', {style: 'height: 100%; width: 100%; position: absolute; z-index: 2'})
                ),
                m(`.bookmark-title${isSelected ? ' .selected' : ''}`, bookmarkNode.title)
            );
        }
    }
};

export default Bookmark;