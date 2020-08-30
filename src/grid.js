import Bookmark from './bookmark.js';
import { getBookmarkStack } from './utils.js';

function Grid() {
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
        oninit: function() {
            getBookmarkStack(m.route.param('bookmarkId')).then(result => {
                nodeStack = result;
                m.redraw();
            });
        },
        oncreate: function() {
            window.addEventListener('resize', function(event) {
                gridPadding = null;
                m.redraw();
                setTimeout(() => {
                    updateGridPadding();
                    m.redraw();
                }, 0);
            });

            document.documentElement.addEventListener('mousemove', function(event) {
                if (dragStartDetected) {
                    dragStart = true;
                    m.redraw();
                }
            });

            muuriRef.value = new Muuri('.grid', {
                dragEnabled: true
            });
            muuriRef.value.on('dragStart', function(item, event) {
                dragStartDetected = true;
                recordFirstMoveEvent = true;
            });
            muuriRef.value.on('move', function(data) {
                if (recordFirstMoveEvent) {
                    recordFirstMoveEvent = false;
                    dragStartIndex = data.fromIndex;
                }
                dragEndIndex = data.toIndex;
            });
            muuriRef.value.on('dragEnd', function(item, event) {
                if (dragStart && !(nodeStack[nodeStack.length - 1].children[dragStartIndex] == null)) {
                    let children = nodeStack[nodeStack.length - 1].children;
                    let bookmark = children[dragStartIndex];
                    children.splice(dragStartIndex, 1);
                    children.splice(dragEndIndex, 0, bookmark);

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

            if (!(nodeStack == null) && nodeStack != [] && nodeStack[nodeStack.length - 1].id != m.route.param('bookmarkId')) {
                getBookmarkStack(m.route.param('bookmarkId')).then(result => {
                    nodeStack = result;
                    m.redraw();
                });
            }
        },

        view: function(vnode) {
            // if ((bookmarkRoot == null && !(vnode.attrs.bookmarkRoot == null)) 
            //     || (!(bookmarkRoot == null) && bookmarkRoot.id != vnode.attrs.bookmarkRoot.id)) {
            //     bookmarkRoot = vnode.attrs.bookmarkRoot;
            //     nodeStack.length = 0;
            //     nodeStack.push(bookmarkRoot);
            // }

            if (nodeStack == null || nodeStack == []) return m('.empty');

            const bookmarkMapper = function(bookmark, index) {
                let settings = {
                    key: bookmark.id,
                    bookmarkNode: bookmark,
                    muuriRef: muuriRef,
                    index: index,
                    isDrag: dragStart,
                    onclick: function (bookmarkNode, event) {
                        gridPadding = null;
                        if (!(bookmarkNode.url == null)) {
                            if (event.ctrlKey) {
                                let win = window.open(bookmarkNode.url, '_blank');
                                win.focus();
                            } else {
                                window.location.href = bookmarkNode.url;
                            }
                        } else if (bookmarkNode.type == "folder") {
                            m.route.set('/folder/' + bookmarkNode.id);
                            nodeStack.push(bookmarkNode);
                        }
                        m.redraw();
                    },
                    ondelete: function() {
                        nodeStack[nodeStack.length - 1].children.splice(index, 1);
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

            updateGridPadding();

            return m('.grid-container',
                {style: gridPadding == null ? 'padding-left: 50px; padding-right: 50px' : `padding-left: ${gridPadding}px; padding-right: ${gridPadding}px`},
                m('.back-button-container', nodeStack.length > 1 ? 
                    m('.back-button.button.borderless-button', { 
                            style: 'font-size: 20px',
                            onclick: function() {
                                gridPadding = null;
                                nodeStack.pop();
                                m.route.set('/folder/' + nodeStack[nodeStack.length - 1].id);
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