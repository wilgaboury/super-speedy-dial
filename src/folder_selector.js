import { findBookmark } from './utils.js';

function FileSelector() {
    let bookmarkRoot = null;
    let nodeStack = [];

    return {
        oninit: function(vnode) {
            browser.bookmarks.getTree().then(root => {
                bookmarkRoot = root[0];
                bookmarkRoot.title = 'Root';

                browser.storage.sync.get('bookmarkRoot', function(value) {
                    if (value.bookmarkRoot == null) {
                        nodeStack.push(bookmarkRoot);
                    } else {
                        let loc = findBookmark(value.bookmarkRoot);
                        nodeStack.unshift(loc);
                        while (!(loc.parentId == null)) {
                            loc = findBookmark(loc.parentId);
                            nodeStack.unshift(loc);
                        }
                    }
                    m.redraw();
                });
            })
        },

        view: function(vnode) {
            return nodeStack.length <= 0 ? m('.empty') :
                m('.selector-container',
                    m('.selector-top-container',
                        m(`.button${nodeStack.length > 1 ? '.save' : '.cancel'}`, {
                            onclick: function(event) {
                                if (nodeStack.length > 1) {
                                    nodeStack.pop();
                                    m.redraw();
                                    vnode.attrs.setSelection(nodeStack[nodeStack.length - 1]);
                                }
                            }
                        }, m('span', {style: 'font-size: 15px'}, m('i.fas.fa-arrow-up.fa-lg'))),
                        m('.breadcrumb-container', function() {
                            let result = [];
                            let pos = 0;

                            while (true) {
                                let capture_pos = pos;
                                console.log(pos);
                                result.push(
                                    m('.button', {
                                            onclick: function(event) {
                                                while (nodeStack.length - 1 > capture_pos) {
                                                    nodeStack.pop();
                                                }
                                                m.redraw();
                                                vnode.attrs.setSelection(nodeStack[capture_pos]);
                                            }
                                        },
                                        nodeStack[pos].title
                                    )
                                );

                                pos++;
                                if (pos > nodeStack.length - 1) break;

                                result.push(m('.breadcrumb-separator', {style: 'margin-top: 5px'}, "\u2b9e"));
                            }

                            return result;
                        }())
                    ),
                    m('.folder-list', nodeStack[nodeStack.length - 1].children.filter(bookmark => bookmark.type == 'folder').map(function(bookmark){
                        return m('button.list-folder-container.button', {
                                style: 'box-sizing: border-box; margin: 0px; border-radius: 0px',
                                ondblclick: function(event) {
                                    nodeStack.push(bookmark);
                                    m.redraw();
                                    vnode.attrs.setSelection(nodeStack[nodeStack.length - 1]);
                                }
                            },
                            m('img.list-folder-image', {src: 'icons/folder.svg', height: '15', style: 'margin-right: 10px'}),
                            m('.list-folder-name', bookmark.title)
                        );
                    }))
                );
        }
    }
}

export default FileSelector;