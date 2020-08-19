import Bookmark from './bookmark.js';

function Grid() {
    let bookmarkRoot;
    let nodeStack = [];

    let dragStart = false;
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

            updateGridPadding();

            const bookmarkMapper = function(bookmark) {
                let settings = {
                    key: bookmark.id,
                    bookmarkNode: bookmark,
                    muuriRef: muuriRef,
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