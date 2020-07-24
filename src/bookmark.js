import { setGridWidth } from './grid_width_hack.js';

function Bookmark(initalVnodes) {
    let parentNode;
    let bookmarkNode;

    setTimeout(setGridWidth, 0);

    return {
        oninit: function(vnode) {
            parentNode = vnode.attrs.parentNode;
            bookmarkNode = vnode.attrs.bookmarkNode;
        },
        view: function(vnode) {
            return m(".bookmark-container", [
                m(".bookmark-card"),
                m(".bookmark-title", bookmarkNode.title)
            ]);
        }
    }
};

export default Bookmark;