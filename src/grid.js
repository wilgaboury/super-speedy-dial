import Bookmark from './bookmark.js';
import {getBookmarkStack} from './utils.js';

function Grid() {
    let nodeStack = [];

    let dragStartDetected = false;
    let dragStart = false;
    let recordFirstMoveEvent = false;
    let dragStartIndex = null;
    let dragEndIndex = null;
    
    let muuri = null;

    let gridPadding = null;

    function updateGridPadding() {
        const bodyWidth = document.documentElement.offsetWidth;
        gridPadding = (((bodyWidth - 100 - 1) % 240) + 100) / 2;
    }

    function areNodeStackAndUrlDesynced() {
        return nodeStack.length == 0 || nodeStack[nodeStack.length - 1].id != m.route.param('bookmarkId');
    }

    function onBookmarkClick(bookmarkNode, event) {
        if (bookmarkNode.url) {
            if (event.ctrlKey) {
                let win = window.open(bookmarkNode.url, '_blank');
                win.focus();
            } else {
                window.location.href = bookmarkNode.url;
            }
        } else if (bookmarkNode.type == "folder") {
            m.route.set('/folder/' + bookmarkNode.id);
            setTimeout(function() {
                nodeStack.push(bookmarkNode);
                m.redraw();
            }, 0);
        }
        m.redraw();
    }

    return {
        oninit: () => {
            console.log(m.route.param('bookmarkId'));
            getBookmarkStack(m.route.param('bookmarkId')).then(stack => {
                nodeStack = stack;
                m.redraw();
            });
        },

        oncreate: () => {
            window.addEventListener('resize', () => {
                updateGridPadding();
                m.redraw();
            });

            document.documentElement.addEventListener('mousemove', () => {
                if (dragStartDetected) {
                    dragStart = true;
                }
            });

            muuri = new Muuri('.grid', {
                dragEnabled: true,
                dragSortPredicate: function(item, e) {
                    return Muuri.ItemDrag.defaultSortPredicate(item);
                }
            });
            muuri.on('dragStart', () => {
                dragStartDetected = true;
                recordFirstMoveEvent = true;
            });
            muuri.on('move', (data) => {
                if (recordFirstMoveEvent) {
                    recordFirstMoveEvent = false;
                    dragStartIndex = data.fromIndex;
                }
                dragEndIndex = data.toIndex;
            });
            muuri.on('dragEnd', () => {
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

        onupdate: () => {
            muuri.layout();
            muuri.refreshItems();
            
            if (areNodeStackAndUrlDesynced()) {
                getBookmarkStack(m.route.param('bookmarkId')).then(result => {
                    nodeStack = result;
                    m.redraw();
                });
            }
        },

        view: () => {
            if (nodeStack == null || nodeStack == []) return m('.empty');

            const bookmarkMapper = function(bookmark, index) {
                let settings = {
                    key: bookmark.id,
                    bookmarkNode: bookmark,
                    muuri: muuri,
                    index: index,
                    onclick: onBookmarkClick,
                    ondelete: () => nodeStack[nodeStack.length - 1].children.splice(index, 1)
                };

                return m(Bookmark, settings);
            };

            updateGridPadding();

            return m('.grid-container',
                {style: gridPadding == null ? 'padding-left: 50px; padding-right: 50px' : `padding-left: ${gridPadding}px; padding-right: ${gridPadding}px`},
                m('.back-button-container', nodeStack.length > 1 ? 
                    m('.back-button.button.borderless-button', { 
                            style: 'font-size: 20px',
                            onclick: () => m.route.set('/folder/' + nodeStack[nodeStack.length - 2].id)
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