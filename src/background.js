import Grid from './grid.js';
import Modal from './modal.js';
import { getFileStorage } from '../lib/idb-file-storage.js'


function Background() {
    let showModal = false;
    let background = null;

    return {
        oninit: function() {
            // browser.storage.local.get("background").then(function(file) {
            //     const reader = new FileReader();
            //     reader.addEventListener('load', function() {
            //         background = reader.result;
            //         m.redraw();
            //     });
            //     reader.readAsDataURL(file);
            // });
            getFileStorage({name: 'wils-storage'}).then(function(storage) {
                storage.get('background').then(function(blob) {
                    console.log("got background");
                    console.log(blob);
                    background = blob;
                    m.redraw();
                }, function() {/* background does not exist, ignore error */});
            });
        },
        view: function() {
            return m('.background', { style: background == null ? '' : `background-image: url(${URL.createObjectURL(background)})`},
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
                        m('div', {style: 'font-size: 20px; margin-bottom: 10px'}, 'Background Image'),
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