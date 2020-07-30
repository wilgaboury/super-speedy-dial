import Bookmark from './bookmark.js';
import { setGridWidth } from './grid_width_hack.js';

function Grid() {
    let bookmarkRoot;
    let nodeStack = [];

    let mouseListenerAdded = false;

    let isInDragMode = false;
    let beingDraggedBookmark = null;
    let mouseDownPosLeft = null;
    let mouseDownPosTop = null;
    let hasMouseMovedDuringClick = false;
    let mousedOverBookmark = null;

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
                    if (isInDragMode) {
                        hasMouseMovedDuringClick = true;

                        let elem = document.querySelector('.grid-container > .bookmark-container');
                        if (elem != null) {
                            elem.style.left = `${event.pageX - mouseDownPosLeft}px`;
                            elem.style.top = `${event.pageY - mouseDownPosTop}px`;
                        }

                        let onMouseUpCallback = function(event) {
                            isInDragMode = false;
                            hasMouseMovedDuringClick = false;
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
                    bookmarkNode: bookmark,
                    onmousedown: function(event, bookmarkNode, left, top) {
                        console.log('mousedown');
                        console.log(`X:${event.offsetX}, Y:${event.offsetY}`);
                        console.log(`Left:${left}, Top:${top}`);
                        isInDragMode = true;
                        beingDraggedBookmark = bookmarkNode.id;
                        mouseDownPosLeft = event.offsetX;
                        mouseDownPosTop = event.offsetY;
                        initLeft = left;
                        initTop = top;
                    },
                    onmouseup: function(event, bookmarkNode) {
                        isInDragMode = false;
                        hasMouseMovedDuringClick = false;

                        if (!hasMouseMovedDuringClick) {
                            if (!(bookmarkNode.url == null)) {
                                window.location.href = bookmarkNode.url;
                            } else if (bookmarkNode.type == "folder") {
                                nodeStack.push(bookmarkNode);
                                m.redraw();
                            }
                        }
                    },
                    onmouseover: function(event, bookmarkNode) {
                        // mousedOverBookmark = bookmarkNode.id;
                    },
                    onmouseout: function(event, bookmarkNode) {
                        // mousedOverBookmark = null;
                    },
                    isBeingDragged: isBeingDragged
                };

                if (!isBeingDragged) {
                    settings.key = bookmark.id;
                } else {
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
                    .filter(bookmark => bookmark.url == null || bookmark.url.substring(0, 6) != "place:")
                    .filter(bookmark => !isInDragMode || !hasMouseMovedDuringClick || bookmark.id != beingDraggedBookmark);

                for (let i = 0; i < bookmarkListNotMapped.length; i++) {
                    if (isInDragMode && hasMouseMovedDuringClick && mousedOverBookmark == bookmarkListNotMapped[i].id) {
                        bookmarkList.push(m('.bookmark-placeholder', {key: beingDraggedBookmark, style: 'width: 240px'}));
                    }
                    bookmarkList.push(bookmarkMapper(bookmarkListNotMapped[i]));
                }
            }

            return m('.grid-container',
                (isInDragMode && hasMouseMovedDuringClick ? nodeStack[nodeStack.length - 1].children.filter(b => b.id == beingDraggedBookmark).map(b => bookmarkMapper(b, true))[0] : m('.empty')),
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