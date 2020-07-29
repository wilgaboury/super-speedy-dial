import Grid from './grid.js';
import Modal from './modal.js';
// import { getIDBObject, setIDBOjbect } from './idb.js';

function Background() {
    let showModal = false;
    let background = null;

    return {
        oninit: function() {
        },
        view: function() {
            return m('.background', { style: background == null ? '' : `background-image: url(${URL.createObjectURL(background)})`},
                m('img.settings-button', {
                    style: 'height: 25px; width: 25px',
                    src: 'icons/cog.svg',
                    onclick: function() {
                        showModal = true;
                        m.redraw()
                    },
                }),
                m(Grid),
                showModal && m(Modal,
                    m('.modal-content',
                        m('h1.settings-label', 'Settings'),
                        m('h2.settings-label', 'Background Image'),
                        m('input#background-input', {type: 'file', style: 'margin-bottom: 10px'}),
                        m('.modal-button-container',
                            m('.flex-spacer'),
                            m('.button', {
                                onclick: function() {
                                    const file = document.querySelector('#background-input').files[0];

                                    getFileStorage({name: 'wils-storage'}).then(function(storage) {
                                        storage.put('background', file).then(() => m.redraw());
                                    });

                                    showModal = false;
                                    m.redraw();
                                }
                            }, 'Save'),
                            m('.button', {
                                onclick: function() {
                                    showModal = false;
                                    m.redraw();
                                }
                            }, 'Cancel')
                        )

                    )
                )
            );
        }
    }
};

export default Background;