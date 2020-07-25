import { setGridWidth } from './grid_width_hack.js';

function Bookmark() {
    let isSelected = false;

    return {
        view: function(vnode) {
            const parentNode = vnode.attrs.parentNode;
            const bookmarkNode = vnode.attrs.bookmarkNode;
            const onFolderClickCallback = vnode.attrs.onFolderClickCallback;

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
                        },
                        onmouseout: function() {
                            isSelected = false;
                            m.redraw();
                        }
                    }, [
                        bookmarkNode.type == 'folder' ? 
                            m('img.folder-image', {src: 'icons/folder.svg', height: '120'}) : 
                            m('img.website-image', {src: `https://www.google.com/s2/favicons?domain=${encodeURI(bookmarkNode.url)}`, height: '120'})
                    ]
                ),
                m(`.bookmark-title${isSelected ? ' .selected' : ''}`, bookmarkNode.title)
            ]);
        }
    }
};

export default Bookmark;