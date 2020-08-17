import Bookmark from './bookmark.js';

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

    let mouseOverBookmark = null;

    let initLeft = null;
    let initTop = null;

    const bookmarkWidth = 240;
    let numPerRow = null;

    function updateNumPerRow() {
        const bodyWidth = document.querySelector('body').offsetWidth;
        numPerRow = Math.floor((bodyWidth - 100) / bookmarkWidth);
        // console.log(bodyWidth);
        // console.log(numPerRow);
    }

    return {
        oninit: function() {
            updateNumPerRow();
            document.querySelector('body').addEventListener('resize', function() { 
                updateNumPerRow();
                console.log('updated');
                m.redraw();
             });
        },

        view: function(vnode) {
            if ((bookmarkRoot == null && !(vnode.attrs.bookmarkRoot == null)) 
                || (!(bookmarkRoot == null) && bookmarkRoot.id != vnode.attrs.bookmarkRoot.id)) {
                bookmarkRoot = vnode.attrs.bookmarkRoot;
                nodeStack.length = 0;
                nodeStack.push(bookmarkRoot);
            }

            const oldNumPerRow = numPerRow;
            updateNumPerRow();

            const bookmarkMapper = function(bookmark, index, isBeingDragged = false) {
                let settings = {
                    key: bookmark.id,
                    bookmarkNode: bookmark,
                    isBeingDragged: isBeingDragged,
                    index: index,
                    doMoveAnim: oldNumPerRow != numPerRow,
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
                        // if (!hasMovedDuringMouseDown) {
                        if (mouseDownBookmark.id == bookmarkNode.id) {
                            if (!(bookmarkNode.url == null)) {
                                window.location.href = bookmarkNode.url;
                            } else if (bookmarkNode.type == "folder") {
                                nodeStack.push(bookmarkNode);
                            }
                        }
                        // }

                        isMouseDown = false;
                        hasMovedDuringMouseDown = false;

                        m.redraw();
                    },
                    onmouseover: function(event, bookmarkNode) {
                        if (isMouseDown && hasMovedDuringMouseDown && bookmarkNode.id == mouseDownBookmark.id) {
                            return;
                        } else {
                            mouseOverBookmark = bookmarkNode;
                        }
                        m.redraw();
                    },
                    onmouseout: function(event, bookmarkNode) {
                    },
                };

                if (isBeingDragged) {
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

                let index = 0;
                for (let i = 0; i < bookmarkListNotMapped.length; i++) {
                    if (isMouseDown && hasMovedDuringMouseDown && mouseOverBookmark == bookmarkListNotMapped[i].id) {
                        bookmarkList.push(m('.bookmark-placeholder', {key: "676e04d8-ce7c-4d60-be61-ada4c8d6b238", style: 'width: 240px'}));
                        index++;
                    }
                    
                    if (isMouseDown && hasMovedDuringMouseDown && mouseDownBookmark.id == bookmarkListNotMapped[i].id) {
                        bookmarkList.push(bookmarkMapper(bookmarkListNotMapped[i], null, true));  
                    } else {
                        bookmarkList.push(bookmarkMapper(bookmarkListNotMapped[i], index++));
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
                            m('span', { style: 'font-size: 15px; margin-right: 10px'}, m('i.fas.fa-arrow-left')),
                            m('span', 'Back')
                        ]
                    ) :
                    m('.back-button-placeholder')
                ),
                m('.grid', {style: `width: ${numPerRow * bookmarkWidth}px`}, bookmarkList)
            );
        }
    }
}

export default Grid;