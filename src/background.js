import Grid from './grid.js';
import Modal from './modal.js';
import { getIDBObject, setIDBObject } from './idb.js';

function Background() {
    let showModal = false;
    let background = null;

    let chosenFile;

    return {
        oninit: function() {
            getIDBObject('background_store', 'background', function(value) {
                background = value;
                m.redraw();
            });
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
                        m('input#background-input', {type: 'file', accept: '.png,.jpg,.jpeg.gif', style: 'margin-bottom: 10px'}),
                        m('.modal-button-container',
                            m('.flex-spacer'),
                            m('.button', {
                                onclick: function() {
                                    background = document.querySelector('#background-input').files[0];
                                    setIDBObject("background_store", 'background', background);

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