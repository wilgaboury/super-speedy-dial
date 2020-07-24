function Grid(initialVnode) {
    let bookmarkTreeRoot;
    let parentNode = null;
    let currentList = [];

    return {
        oninit: function() {
            browser.bookmarks.getTree().then(tree => {
                bookmarkTreeRoot = tree[0].children.filter(b => b.id === 'menu________')[0];
                currentList = bookmarkTreeRoot.children;
                m.redraw();
            })
        },
        view: function(vnode) {
            return m(".grid-container","Some test text");
        }
    }
}

export default Grid;