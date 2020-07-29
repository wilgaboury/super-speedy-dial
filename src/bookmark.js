import { doMoveAnimation } from './utils.js';

function Bookmark() {
    let isSelected = false;

    let first;
    let last;

    return {
        oninit: function(vnode) {
            console.log(vnode.attrs.bookmarkNode);
        },

        onbeforeupdate: function(newVnode, oldVnode) {
            first = oldVnode.dom.getBoundingClientRect();
        },

        onupdate: function(vnode) {
            last = vnode.dom.getBoundingClientRect();

            doMoveAnimation(first, last, vnode.dom);
        },

        view: function(vnode) {
            const bookmarkNode = vnode.attrs.bookmarkNode;
            const onmousedown = vnode.attrs.onmousedown;
            const onmouseup = vnode.attrs.onmouseup;
            const onmouseover = vnode.attrs.onmousover;

            return m(".bookmark-container", [
                m(".bookmark-card", {
                        onmousedown: function(event) {
                            isSelected = true;
                            onmousedown(event, bookmarkNode);
                            m.redraw();
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
                        onmouseout: function() {
                            isSelected = false;
                            m.redraw();
                        }
                    }, [
                        bookmarkNode.type == 'folder' ? 
                            m('img.folder-image', {src: 'icons/folder.svg', height: '120'}) : 
                            m('img.website-image', {src: `https://www.google.com/s2/favicons?domain=${encodeURI(bookmarkNode.url)}`, height: '32'})
                    ]
                ),
                m(`.bookmark-title${isSelected ? ' .selected' : ''}`, bookmarkNode.title)
            ]);
        }
    }
};

export default Bookmark;