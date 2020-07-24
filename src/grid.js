import Bookmark from './bookmark.js'

function Grid(initialVnode) {
    let bookmarkRoot;
    let nodeStack = [];

    return {
        oninit: function() {
            browser.bookmarks.getTree().then(root => {
                bookmarkRoot = root[0].children.filter(b => b.id === 'menu________')[0];
                nodeStack.push(bookmarkRoot);
                m.redraw();
            })
        },
        view: function(vnode) {
            return m(".grid-container", nodeStack.length == 0 ? m(".empty") : nodeStack[nodeStack.length - 1].children.map(bookmark => {
                return m(Bookmark, {
                    parentNode: nodeStack[nodeStack.length - 1], 
                    bookmarkNode: bookmark
                });
            }));
        }
    }
}

export default Grid;