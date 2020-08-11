function FileSelector() {
    let bookmarkRoot;
    let nodeStack = [];

    return {
        oninit: function(vnode) {
            browser.bookmarks.getTree().then(root => {
                bookmarkRoot = root[0];
                bookmarkRoot
                nodeStack.push(bookmarkRoot);
                m.redraw();
            })
        },
        view: function(vnode) {
            return nodeStack.length == 0 ? m('.empty') :
                m('.selector-container',
                    m('.selector-top-container',
                        m(`.button${nodeStack.length > 1 ? '.cancel' : '.save'}`, {
                            onclick: function(event) {
                                if (nodeStack.length > 1) {
                                    nodeStack.pop();
                                    vnode.attrs.setSelection(nodeStack[nodeStack.length - 1]);
                                    m.redraw();
                                }
                            }
                        }, 'Go Up'),
                        m('breadcrumb-container', function() {
                            let result = [];
                            let pos = 0;

                            while (true) {
                                result.push(
                                    m('.button', {
                                            onclick: function(event) {
                                                while (nodeStack.length - 1 > pos) {
                                                    nodeStack.pop();
                                                }
                                                m.redraw();
                                                vnode.attrs.setSelection(nodeStack[pos]);
                                            }
                                        }, 
                                        nodeStack[pos].title
                                    )
                                );

                                pos++;
                                if (pos > nodeStack.length - 1) break;

                                result.push(m('.breadcrumb-separator', "\u2b9e"));
                            }

                            return result;
                        }())
                    ),
                    m('.folder-list', nodeStack[nodeStack.length - 1].children.filter(bookmark => bookmark.type == 'folder').map(function(bookmark){
                        return m('.list-folder-container.button', {
                                ondblclick: function(event) {
                                    nodeStack.push(bookmark);
                                    vnode.attrs.setSelection(nodeStack[nodeStack.length - 1]);
                                    m.redraw();
                                }
                            },
                            m('img.list-folder-image'),
                            m('.list-folder-name', bookmark.title)
                        );
                    }))
                );
        }
    }
}

export default FileSelector;