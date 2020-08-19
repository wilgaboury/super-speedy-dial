import Bookmark from './bookmark.js';

function Grid() {
    let bookmarkRoot;
    let nodeStack = [];

    let dragStartDetected = false;
    let dragStart = false;
    let recordFirstMoveEvent = false;
    let dragStartIndex = null;
    let dragEndIndex = null;

    let muuriRef = {
        value: null
    };

    let gridPadding = null;
    function updateGridPadding() {
        const bodyWidth = document.documentElement.offsetWidth;
        gridPadding = (((bodyWidth - 100) % 240) + 100) / 2;
    }

    return {
        oncreate: function() {
            window.addEventListener('resize', function(event) { 
                updateGridPadding();
                m.redraw();
            });

            document.documentElement.addEventListener('mousemove', function(event) {
                if (dragStartDetected) {
                    console.log('detected drag start');
                    dragStart = true;
                }
            });

            muuriRef.value = new Muuri('.grid', {
                dragEnabled: true
            });
            console.log(muuriRef.value);
            muuriRef.value.on('dragStart', function(item, event) {
                dragStartDetected = true;
                recordFirstMoveEvent = true;
            });
            muuriRef.value.on('move', function(data) {
                console.log(data.fromIndex);
                if (recordFirstMoveEvent) {
                    recordFirstMoveEvent = false;
                    dragStartIndex = data.fromIndex;
                }
                dragEndIndex = data.toIndex;
            });
            muuriRef.value.on('dragEnd', function(item, event) {
                console.log(event);

                if (dragStart && !(nodeStack[nodeStack.length - 1].children[dragStartIndex] == null)) {
                    let children = nodeStack[nodeStack.length - 1].children;
                    let bookmark = children[dragStartIndex];
                    children.splice(dragStartIndex, 1);
                    children.splice(dragEndIndex, 0, bookmark);
                    
                    console.log(dragStartIndex);
                    console.log(dragEndIndex);

                    browser.bookmarks.move(bookmark.id, {
                        parentId: nodeStack[nodeStack.length - 1].id,
                        index: dragEndIndex
                    });

                    m.redraw();
                }

                dragStartDetected = false;
                dragStart = false;
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

            updateGridPadding();

            const bookmarkMapper = function(bookmark, index) {
                let settings = {
                    key: bookmark.id,
                    bookmarkNode: bookmark,
                    muuriRef: muuriRef,
                    index: index,
                    onclick: function (bookmarkNode) {
                        if (!(bookmarkNode.url == null)) {
                            window.location.href = bookmarkNode.url;
                        } else if (bookmarkNode.type == "folder") {
                            nodeStack.push(bookmarkNode);
                        }
                    }
                };

                return m(Bookmark, settings);
            };

            let gridElems = [];
            if (nodeStack.length > 0) {
                let children = nodeStack[nodeStack.length - 1].children;
                for (let i = 0; i < children.length; i++) {
                    gridElems.push(bookmarkMapper(children[i], i));
                }
            }

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
                m('.grid', gridElems)
            );
        }
    }
}

export default Grid;