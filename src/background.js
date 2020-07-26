import Grid from './grid.js';
import Modal from './modal.js';

function Background() {
    let showModal = false;

    return {
        view: function() {
            return m('.background',
                m('img.settings-button', {src:'icons/cog.svg', height:'25', onclick: function() { showModal = true; m.redraw() }}),
                m(Grid),
                showModal && m(Modal,
                    m('.modal-content',
                        m('input#background-input', {type: 'file'})
                    )
                )
            );
        }
    }
};

export default Background;