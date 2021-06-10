import { getStartFolder } from './utils.js';

const Redirect = {
    oninit: function() {
        getStartFolder().then(bookmark => {
            console.log(bookmark)
            m.route.set('/folder/' + bookmark.id);
            // window.location.reload();
            m.redraw();
        })
    },

    view: function() {
        return m('.empty');
    }
};

export default Redirect;