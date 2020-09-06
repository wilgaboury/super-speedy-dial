import { getRootFolder } from './utils.js';

const Redirect = {
    oninit: function() {
        getRootFolder().then(bookmark => {
            m.route.set('/folder/' + bookmark.id);
            window.location.reload();
            m.redraw();
        })
    },

    view: function() {
        return m('.empty');
    }
};

export default Redirect;