import Grid from './grid.js';
import Modal from './modal.js';
import FolderSelector from './folder_selector.js'
import { getStartFolder } from './utils.js';
import { getIDBObject, setIDBObject, deleteIDBObject } from './idb.js';

function Background() {
    let showModal = false;
    let background = null;
    let bookmarkStart = null;
    let bookmarkStartTemp = null;

    let removeBackground = false;

    return {
        oninit: function() {
            getIDBObject('background_store', 'background', function(value) {
                if (value == null) {
                    background = 'images/my_default_background.png';
                } else {
                    background = URL.createObjectURL(value);
                }
                m.redraw();
            });

            getStartFolder().then(value => {
                bookmarkStart = value;
                m.redraw();
            });
        },
        view: function() {
            return m('.background', { style: background == null ? '' : `background-image: url(${background})`},
                m('.settings-buttons-container',
                    m('.settings-button', {
                            onclick: function() {
                                removeBackground = false;
                                showModal = true;
                                m.redraw()
                            },
                        },
                        m('i.fa.fa-cog')
                    )//,
                    // m('.settings-button', m('i.fa.fa-bookmark')),
                    // m('.settings-button', m('i.fa.fa-folder')),
                    // m('.settings-button', m('i.fa.fa-pen'))
                ),
                m(Grid),
                showModal && m(Modal,
                    m('.modal-content',
                        m('h1.settings-label', 'Settings'),
                        m('h2.settings-label', 'Background Image'),
                        m('.modal-button-container', [
                            removeBackground || m('input#background-input', {type: 'file', accept: '.png,.jpg,.jpeg.gif', style: 'margin-bottom: 10px'}),
                            removeBackground || m('.flex-spacer'),
                            m('.button.cancel', {
                                onclick: () => {
                                    let file = document.getElementById('background-input');
                                    if (file.value) {
                                        file.value = null;
                                    } else {
                                        removeBackground = true;
                                        m.redraw();
                                    }
                                }
                            }, 'Remove')
                        ]),
                        m('h2.settings-label', 'Root Folder'),
                        m(FolderSelector, {setSelection: bookmark => bookmarkStartTemp = bookmark}),
                        m('.modal-button-container',
                            m('.flex-spacer'),
                            m('.button.save', {
                                onclick: function() {
                                    let file = document.querySelector('#background-input');
                                    if (file) {
                                        file = file.files[0]
                                        background = URL.createObjectURL(file);
                                        setIDBObject("background_store", 'background', file);
                                    } else if (removeBackground) {
                                        background = 'images/my_default_background.png';
                                        deleteIDBObject("background_store", "background");
                                    }

                                    if (bookmarkStartTemp) {
                                        bookmarkStart = bookmarkStartTemp;
                                        browser.storage.local.set({'bookmarkRoot': bookmarkStart.id});
                                        console.log("goto " + '/folder/' + bookmarkStart.id)
                                        m.route.set('/folder/' + bookmarkStart.id);
                                        m.redraw();
                                    }

                                    showModal = false;
                                    m.redraw();
                                }
                            }, 'Save'),
                            m('.button.cancel', {
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