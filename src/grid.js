import Bookmark from './bookmark.js';
import { setGridWidth } from './grid_width_hack.js';

function Grid() {
    let bookmarkRoot;
    let nodeStack = [];

    let mouseListenerAdded = false;

    let isMouseDown = false;
    let hasMovedDuringMouseDown = false;
    let mouseDownBookmark = null;
    let mouseDownNode = null;
    let mouseDownPosLeft = null;
    let mouseDownPosTop = null;

    let initLeft = null;
    let initTop = null;

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
                document.querySelector('body').addEventListener('mousemove', function(event) {
                    if (isMouseDown) {
                        hasMovedDuringMouseDown = true;

                        m.redraw();
                        
                        mouseDownNode.style.left = `${event.pageX - mouseDownPosLeft}px`;
                        mouseDownNode.style.top = `${event.pageY - mouseDownPosTop}px`;

                        let onMouseUpCallback = function(event) {
                            isMouseDown = false;
                            hasMovedDuringMouseDown = false;
                            m.redraw();

                            document.querySelector('body').removeEventListener('onmouseup', onMouseUpCallback);
                        }
                        document.querySelector('body').addEventListener('onmouseup', onMouseUpCallback);
                    }
                });
            }
        },

        view: function(vnode) {
            let bookmarkMapper = function(bookmark, isBeingDragged = false) {
                let settings = {
                    key: bookmark.id,
                    bookmarkNode: bookmark,
                    isBeingDragged: isBeingDragged,
                    onmousedown: function(event, bookmarkNode, node) {
                        isMouseDown = true;
                        mouseDownBookmark = bookmarkNode;
                        mouseDownNode = node;
                        mouseDownPosLeft = event.offsetX;
                        mouseDownPosTop = event.offsetY;

                        let rect = node.getBoundingClientRect();
                        initLeft = rect.left;
                        initTop = rect.top;
                    },
                    onmouseup: function(event, bookmarkNode) {
                        if (!hasMovedDuringMouseDown) {
                            if (!(bookmarkNode.url == null)) {
                                window.location.href = bookmarkNode.url;
                            } else if (bookmarkNode.type == "folder") {
                                nodeStack.push(bookmarkNode);
                                m.redraw();
                            }
                        }

                        isMouseDown = false;
                        hasMovedDuringMouseDown = false;
                    },
                    onmouseover: function(event, bookmarkNode) {
                    },
                    onmouseout: function(event, bookmarkNode) {
                    },
                };

                if (isBeingDragged) {
                    settings.isSelected = true;

                    settings.left = initLeft - mouseDownPosLeft;
                    settings.top = initTop - mouseDownPosTop;
                }

                return m(Bookmark, settings);
            };

            let bookmarkList = [];
            if (nodeStack.length > 0) {
                let bookmarkListNotMapped = nodeStack[nodeStack.length - 1].children
                    .filter(bookmark => bookmark.type != 'separator')
                    .filter(bookmark => bookmark.url == null || bookmark.url.substring(0, 6) != "place:");

                for (let i = 0; i < bookmarkListNotMapped.length; i++) {
                    // if (isMouseDown && hasMovedDuringMouseDown && mousedOverBookmark == bookmarkListNotMapped[i].id) {
                    //     bookmarkList.push(m('.bookmark-placeholder', {key: "676e04d8-ce7c-4d60-be61-ada4c8d6b238", style: 'width: 240px'}));
                    // }
                    
                    if (isMouseDown && hasMovedDuringMouseDown && mouseDownBookmark.id == bookmarkListNotMapped[i].id) {
                        bookmarkList.push(bookmarkMapper(bookmarkListNotMapped[i], true));  
                    } else {
                        bookmarkList.push(bookmarkMapper(bookmarkListNotMapped[i]));
                    }
                }
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