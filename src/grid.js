import Bookmark from './bookmark.js';
import { setGridWidth } from './grid_width_hack.js';

function Grid() {
    let bookmarkRoot;
    let nodeStack = [];

    let mouseListenerAdded = false;

    let isInDragMode = false;
    let mouseDownPosLeft = null;
    let mouseDownPosTop = null;
    let hasMouseMovedDuringClick = false;

    setTimeout(setGridWidth, 0);

    return {
        oninit: function() {
            browser.bookmarks.getTree().then(root => {
                bookmarkRoot = root[0].children.filter(b => b.id === 'menu________')[0];
                nodeStack.push(bookmarkRoot);
                m.redraw();
            })
        },

        onupdate: function(vnode) {
            if (!mouseListenerAdded) {
                mouseListenerAdded = true;
                document.querySelector('.grid-container').addEventListener('mousemove', function(event) {
                    if (isInDragMode) {
                        hasMouseMovedDuringClick = true;

                        let style = document.querySelector('.grid-container > .bookmark-container').style;
                        style.left = event.offsetX - mouseDownPosLeft;
                        style.top = eventt.offsetY - mouseDownPosTop;
                    }
                });
            }
        },

        view: function(vnode) {
            let bookmarkList = [];
            if (nodeStack.length > 0) {
                bookmarkList = nodeStack[nodeStack.length - 1].children
                    .filter(bookmark => bookmark.type != 'separator')
                    .filter(bookmark => bookmark.url == null || bookmark.url.substring(0, 6) != "place:")
                    .map(bookmark => {
                        return m(Bookmark, {
                            bookmarkNode: bookmark,
                            onmousedown: function(event, bookmarkNode) {
                                isInDragMode = true;
                            },
                            onmouseup: function(event, bookmarkNode) {
                                isInDragMode = false;

                                if (!hasMouseMovedDuringClick) {
                                    if (!(bookmarkNode.url == null)) {
                                        window.location.href = bookmarkNode.url;
                                    } else if (bookmarkNode.type == "folder") {
                                        nodeStack.push(bookmarkNode);
                                        m.redraw();
                                    }
                                } else {
                                    hasMouseMovedDuringClick = false;
                                }
                            },
                            onmouseover: function(event, bookmarkNode) {

                            }
                        });
                    });
            }

            return m('.grid-container',
                m('.back-button-container', nodeStack.length > 1 ? 
                    m('.back-button.button', { 
                            style: 'font-size: 20px',
                            onclick: function() {
                                nodeStack.pop();
                                m.redraw();
                            }
                        }, [
                            m('img', { src: 'icons/back.svg', height: '14', style: 'margin-right: 10px;'}),
                            m('span', 'Back')
                        ]
                    ) :
                    m('.back-button-placeholder')
                ),
                m('.grid', bookmarkList)
            );
        }
    }
}

export default Grid;