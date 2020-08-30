import { getRootFolder } from './utils.js';

const Redirect = {
    oninit: function() {
        // console.log('does this get run');
        getRootFolder().then(bookmark => {
            // console.log(bookmark);
            m.route.set('/folder/' + bookmark.id);
            window.location.reload();
            m.redraw();
        })
    },

    view: function() {
        // console.log('does this get run?');
        return m('.empty');
    }
};

export default Redirect;