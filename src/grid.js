import Bookmark from './bookmark.js';
import { setGridWidth } from './grid_width_hack.js';

function Grid(initialVnode) {
    let bookmarkRoot;
    let nodeStack = [];

    let onFolderClickCallback = function(bookmark) {
        nodeStack.push(bookmark);
        m.redraw();
    }

    setTimeout(setGridWidth, 0);

    return {
        oninit: function() {
            browser.bookmarks.getTree().then(root => {
                bookmarkRoot = root[0].children.filter(b => b.id === 'menu________')[0];
                nodeStack.push(bookmarkRoot);
                m.redraw();
            })
        },
        view: function(vnode) {
            return [
                
                m('.grid-container', nodeStack.length == 0 ? m('div') : nodeStack[nodeStack.length - 1].children
                    .filter(bookmark => bookmark.type != 'separator')
                    .map(bookmark => {
                        return m(Bookmark, {
                            parentNode: nodeStack[nodeStack.length - 1], 
                            bookmarkNode: bookmark,
                            onFolderClickCallback: onFolderClickCallback
                        });
                    })
                )
            ];
        }
    }
}

export default Grid;