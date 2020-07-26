import Grid from './grid.js';
import Modal from './modal.js';

function Background() {
    let showModal = false;
    let background = null;

    return {
        oninit: function() {
            browser.storage.local.get("background").then(function(file) {
                background = file;
                m.redraw();
            })
        },
        view: function() {
            return m('.background', {style: background == null ? '' : `background-image: url(${background})`},
                m('img.settings-button', {
                    src:'icons/cog.svg', 
                    height:'25', 
                    onclick: function() { 
                        showModal = true; 
                        m.redraw() 
                    },
                }),
                m(Grid),
                showModal && m(Modal,
                    m('.modal-content',
                        m('input#background-input', {type: 'file'}),
                        m('.modal-button-container',
                            m('.button', {
                                onclick: function() {
                                    const file = document.querySelector('#background-input').files[0];
                                    browser.storage.local.set({
                                        background: file
                                    });
                                    showModal = false;
                                    m.redraw();
                                }
                            }, 'Ok'),
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