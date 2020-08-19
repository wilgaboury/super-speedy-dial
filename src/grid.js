import Bookmark from './bookmark.js';

function Grid() {
    let dom;

    let bookmarkRoot;
    let nodeStack = [];

    // let mouseListenerAdded = false;

    let isMouseDown = false;
    let hasMovedDuringMouseDown = false;
    let mouseDownBookmark = null;
    // let mouseDownNode = null;
    // let mouseDownPosLeft = null;
    // let mouseDownPosTop = null;

    let mouseOverBookmark = null;

    // let initLeft = null;
    // let initTop = null;

    let dragStart = false;
    let dragStartIndex = null;
    let dragEndIndex = null;

    let muuriRef = {
        value: null
    };

    const bookmarkWidth = 240;
    let gridPadding = null;

    function updateNumPerRow() {
        const bodyWidth = document.documentElement.offsetWidth;
        gridPadding = (((bodyWidth - 100) % 240) + 100) / 2;
        // console.log(bodyWidth - gridPadding * 2);
    }

    return {
        oncreate: function() {
            window.addEventListener('resize', function(event) { 
                updateNumPerRow();
                m.redraw();
            });

            muuriRef.value = new Muuri('.grid', {
                dragEnabled: true
            });
            muuriRef.value.on('dragStart', function(item, event) {
                dragStart = true;
            });
            muuriRef.value.on('move', function(data) {
                if (dragStart) {
                    dragStart = false;
                    dragStartIndex = data.fromIndex;
                }
                dragEndIndex = data.toIndex;
            });
            muuriRef.value.on('dragEnd', function(item, event) {
                let children = nodeStack[nodeStack.length - 1].children;
                let bookmark = children[dragStartIndex];
                children.splice(dragStartIndex, 1);
                children.splice(dragEndIndex, 0, bookmark);

                browser.bookmarks.move(bookmark.id, {
                    parentId: nodeStack[nodeStack.length - 1].id,
                    index: dragEndIndex
                });

                m.redraw();
            });

        },

        onupdate: function() {
            muuriRef.value.layout();
            muuriRef.value.refreshItems();
        },

        view: function(vnode) {
            if ((bookmarkRoot == null && !(vnode.attrs.bookmarkRoot == null)) 
                || (!(bookmarkRoot == null) && bookmarkRoot.id != vnode.attrs.bookmarkRoot.id)) {
                bookmarkRoot = vnode.attrs.bookmarkRoot;
                nodeStack.length = 0;
                nodeStack.push(bookmarkRoot);
            }

            updateNumPerRow();

            const bookmarkMapper = function(bookmark) { //, index, isBeingDragged = false) {
                let settings = {
                    key: bookmark.id,
                    bookmarkNode: bookmark,
                    muuriRef: muuriRef,
                    // isBeingDragged: isBeingDragged,
                    // index: index,
                    // doMoveAnim: oldNumPerRow != numPerRow,
                    // onmousedown: function(event, bookmarkNode, node) {
                    //     isMouseDown = true;
                    //     mouseDownBookmark = bookmarkNode;
                    //     mouseDownNode = node;
                    //     mouseDownPosLeft = event.offsetX;
                    //     mouseDownPosTop = event.offsetY;

                    //     let rect = node.getBoundingClientRect();
                    //     initLeft = rect.left;
                    //     initTop = rect.top;
                    // },
                    // onmouseup: function(event, bookmarkNode) {
                    //     // if (!hasMovedDuringMouseDown) {
                    //     if (mouseDownBookmark.id == bookmarkNode.id) {
                    //         if (!(bookmarkNode.url == null)) {
                    //             window.location.href = bookmarkNode.url;
                    //         } else if (bookmarkNode.type == "folder") {
                    //             nodeStack.push(bookmarkNode);
                    //         }
                    //     }
                    //     // }

                    //     isMouseDown = false;
                    //     hasMovedDuringMouseDown = false;

                    //     m.redraw();
                    // },
                    // onmouseover: function(event, bookmarkNode) {
                    //     if (isMouseDown && hasMovedDuringMouseDown && bookmarkNode.id == mouseDownBookmark.id) {
                    //         return;
                    //     } else {
                    //         mouseOverBookmark = bookmarkNode;
                    //     }
                    //     m.redraw();
                    // },
                    // onmouseout: function(event, bookmarkNode) {
                    // },
                    onclick: function (bookmarkNode) {
                        if (!(bookmarkNode.url == null)) {
                            window.location.href = bookmarkNode.url;
                        } else if (bookmarkNode.type == "folder") {
                            nodeStack.push(bookmarkNode);
                        }
                    }
                };

                // if (isBeingDragged) {
                //     settings.left = initLeft - mouseDownPosLeft;
                //     settings.top = initTop - mouseDownPosTop;
                // }

                return m(Bookmark, settings);
            };

            // let bookmarkList = [];
            // if (nodeStack.length > 0) {
            //     let bookmarkListNotMapped = nodeStack[nodeStack.length - 1].children
            //         .filter(bookmark => bookmark.type != 'separator')
            //         .filter(bookmark => bookmark.url == null || bookmark.url.substring(0, 6) != "place:");

            //     let index = 0;
            //     for (let i = 0; i < bookmarkListNotMapped.length; i++) {
            //         if (isMouseDown && hasMovedDuringMouseDown && mouseOverBookmark == bookmarkListNotMapped[i].id) {
            //             bookmarkList.push(m('.bookmark-placeholder', {key: "676e04d8-ce7c-4d60-be61-ada4c8d6b238", style: 'width: 240px'}));
            //             index++;
            //         }
                    
            //         if (isMouseDown && hasMovedDuringMouseDown && mouseDownBookmark.id == bookmarkListNotMapped[i].id) {
            //             bookmarkList.push(bookmarkMapper(bookmarkListNotMapped[i], null, true));  
            //         } else {
            //             bookmarkList.push(bookmarkMapper(bookmarkListNotMapped[i], index++));
            //         }
            //     }
            // }

            return m('.grid-container',
                {style: gridPadding == null ? 'padding-left: 50px; padding-right: 50px' : `padding-left: ${gridPadding}px; padding-right: ${gridPadding}px`},
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
                m('.grid', nodeStack.length == 0 ? [] : nodeStack[nodeStack.length - 1].children.map(bookmarkMapper))
            );
        }
    }
}

export default Grid;