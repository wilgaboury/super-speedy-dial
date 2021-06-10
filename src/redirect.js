import { getStartFolder } from './utils.js';

const Redirect = {
    oninit: function() {
        getStartFolder().then(bookmark => {
            m.route.set('/folder/' + bookmark.id);
            m.redraw();
        })
    },

    view: function() {
        return m('.empty');
    }
};

export default Redirect;