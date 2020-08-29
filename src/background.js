import Grid from './grid.js';
import Modal from './modal.js';
import FolderSelector from './folder_selector.js'
import { setBookmarkRoot, findBookmark } from './utils.js';
import { getIDBObject, setIDBObject } from './idb.js';

function Background() {
    let showModal = false;
    let background = null;
    let bookmarkRoot = null;

    let bookmarkRootTemp = null;

    return {
        oninit: function() {
            m.route.param('bookmarkId');
            getIDBObject('background_store', 'background', function(value) {
                if (value == null) {
                    background = 'images/my_default_background.png';
                } else {
                    background = URL.createObjectURL(value);
                }
                m.redraw();
            });

            browser.storage.sync.get('bookmarkRoot', function(value) {
                browser.bookmarks.getTree().then(root => {
                    setBookmarkRoot(root[0]);
                    if (value.bookmarkRoot == null) {
                        bookmarkRoot = root[0];
                    } else {
                        bookmarkRoot = findBookmark(value.bookmarkRoot);
                    }
                    m.redraw();
                });
            });
        },
        view: function() {
            return m('.background', { style: background == null ? '' : `background-image: url(${background})`},
                m('.settings-buttons-container',
                    m('.settings-button', {
                            onclick: function() {
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
                m(Grid), //, {bookmarkRoot: bookmarkRoot}),
                showModal && m(Modal,
                    m('.modal-content',
                        m('h1.settings-label', 'Settings'),
                        m('h2.settings-label', 'Background Image'),
                        m('input#background-input', {type: 'file', accept: '.png,.jpg,.jpeg.gif', style: 'margin-bottom: 10px'}),
                        m('h2.settings-label', 'Root Folder'),
                        m(FolderSelector, {setSelection: bookmark => bookmarkRootTemp = bookmark}),
                        m('.modal-button-container',
                            m('.flex-spacer'),
                            m('.button.save', {
                                onclick: function() {
                                    let file = document.querySelector('#background-input').files[0];
                                    if (!(file == null)) {
                                        background = URL.createObjectURL(file);
                                        setIDBObject("background_store", 'background', file);
                                    }

                                    if (!(bookmarkRootTemp == null)) {
                                        bookmarkRoot = bookmarkRootTemp;
                                        browser.storage.sync.set({'bookmarkRoot': bookmarkRoot.id});
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