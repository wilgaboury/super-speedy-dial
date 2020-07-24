function Grid(initialVnode) {
    let bookmarkTreeRoot;
    let nodeStack = [];

    return {
        oninit: function() {
            browser.bookmarks.getTree().then(tree => {
                bookmarkTreeRoot = tree[0].children.filter(b => b.id === 'menu________')[0];
                nodeStack.push(bookmarkTreeRoot);
                m.redraw();
            })
        },
        view: function(vnode) {
            return m(".grid-container","Some test text");
        }
    }
}

export default Grid;