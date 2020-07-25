import { setGridWidth } from './grid_width_hack.js';

function Bookmark(initalVnodes) {
    let parentNode;
    let bookmarkNode;
    let onFolderClickCallback;

    let isSelected = false;

    return {
        oninit: function(vnode) {
            parentNode = vnode.attrs.parentNode;
            bookmarkNode = vnode.attrs.bookmarkNode;
            onFolderClickCallback = vnode.attrs.onFolderClickCallback;
        },
        view: function(vnode) {
            return m(".bookmark-container", [
                m(".bookmark-card", {
                    onclick: function() {
                        if (!(bookmarkNode.url == null)) {
                            window.location.href = bookmarkNode.url;
                        } else if (bookmarkNode.type == "folder") {
                            onFolderClickCallback(bookmarkNode);
                        }
                    },
                    onmousedown: function() {
                        isSelected = true;
                        m.redraw();
                    },
                    onmouseup: function() {
                        isSelected = false;
                        m.redraw();
                    }
                }),
                m(`.bookmark-title${isSelected ? ' .selected' : ''}`, bookmarkNode.title)
            ]);
        }
    }
};

export default Bookmark;