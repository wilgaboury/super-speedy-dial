import Modal from './modal.js'
import { doMoveAnimation } from './utils.js';

let rects = new Map();

function Bookmark() {
    let bookmarkNode = null;

    let isSelected = false;

    let rectBeforeUpdate = null;
    let transformRect;

    let showModal;
    let tempTitle = null;
    let tempURL = null;

    return {
        oncreate: function(vnode) {
            // rectBeforeUpdate = vnode.dom.getBoundingClientRect();
            vnode.attrs.muuriRef.value.add(vnode.dom);
            vnode.dom.addEventListener('click', (e) => e.preventDefault());
        },

        onremove: function(vnode) {

        },

        // onupdate: function(vnode) {
        //     if (vnode.attrs.doMoveAnim && rectBeforeUpdate != null) {
        //         doMoveAnimation(rectBeforeUpdate, vnode.dom.getBoundingClientRect(), vnode.dom, bookmarkNode.id);
        //     }
        //     rectBeforeUpdate = vnode.dom.getBoundingClientRect();
        // },

        view: function(vnode) {
            bookmarkNode = vnode.attrs.bookmarkNode;

            // const onmousedown = vnode.attrs.onmousedown;
            // const onmouseup = vnode.attrs.onmouseup;
            // const onmouseover = vnode.attrs.onmouseover;
            // const onmouseout = vnode.attrs.onmouseout;

            const onclick = vnode.attrs.onclick;

            // const isBeingDragged = vnode.attrs.isBeingDragged;
            // const left = vnode.attrs.left;
            // const top = vnode.attrs.top;

            if (!(vnode.attrs.isSelected == null)) {
                isSelected = vnode.attrs.isSelected;
            }
            if (!(vnode.attrs.transformRect == null)) {
                transformRect = vnode.attrs.transformRect;
            }

            return m('.item', m('.item-content', m('.bookmark-container', {
                    id: `bookmark_${vnode.attrs.key}`,
                    // style: isBeingDragged ? `position: absolute; z-index: 1; left: ${left}px; top: ${top}px` : '',
                    // onmousedown: function(event) {
                    //     isSelected = true;
                    //     onmousedown(event, bookmarkNode, vnode.dom);
                    // },
                    // onmouseup: function(event) {
                    //     isSelected = false;
                    //     onmouseup(event, bookmarkNode);
                    //     m.redraw();
                    // },
                    // onmouseover: function(event) {
                    //     onmouseover(event, bookmarkNode);
                    //     m.redraw();
                    // },
                    // onmouseout: function(event) {
                    //     isSelected = false;
                    //     onmouseout(event, bookmarkNode);
                    //     m.redraw();
                    // }
                    onmousedown: () => isSelected = true,
                    onmouseup: () => isSelectod = false,
                    onmouseout: () => isSelected = false,
                    onclick: function (event) {
                        onclick(bookmarkNode);
                    }
                },
                m(".bookmark-card", {style: 'position: relative; ' + (isSelected ? 'border: 2px solid #0390fc' : '')},
                    (bookmarkNode.type == 'folder' ? 
                        m('img.folder-image', {src: 'icons/folder.svg', height: '120'}) : 
                        m('img.website-image', {src: `https://api.statvoo.com/favicon/?url=${encodeURI(bookmarkNode.url)}`, height: '32'})),
                            //`https://www.google.com/s2/favicons?domain=${encodeURI(bookmarkNode.url)}`, height: '32'})),
                    m('.bookmark-cover', {style: 'height: 100%; width: 100%; position: absolute; z-index: 2'},
                        m('.edit-bookmark-button.plastic-button', {
                                style: 'float: right; margin: 6px; height: 25px; width: 25px',
                                onclick: function(event) {
                                    showModal = true;
                                    tempTitle = bookmarkNode.title;
                                    tempURL = bookmarkNode.url;
                                    m.redraw();

                                    event.stopPropagation();
                                },
                                onmousedown: function(event) {
                                    event.stopPropagation();
                                },
                                onmouseup: function(event) {
                                    event.stopPropagation();
                                }
                            }, '...',
                            showModal && m(Modal,
                                m('.modal-content',
                                    m('h1.settings-label', `Edit ${bookmarkNode.type == 'folder' ? 'Folder' : 'Bookmark'}`),
                                    m('h2.settings-label', 'Title'),
                                    m('input.text-input.bookmark-edit-title', {
                                        type: 'text', 
                                        value: bookmarkNode.title
                                    }),
                                    bookmarkNode.type != 'folder' && m('h2.settings-label', 'URL'),
                                    bookmarkNode.type != 'folder' && m('input.text-input.bookmark-edit-url', {
                                        type: 'text', 
                                        value: bookmarkNode.url
                                    }),
                                    m('.modal-button-container', {
                                            style: 'margin-top: 15px'
                                        },
                                        m('.flex-spacer'),
                                        m('.button.save', {
                                            onclick: function() {
                                                let updateObject = {};

                                                bookmarkNode.title = document.querySelector('.bookmark-edit-title').value;
                                                updateObject.title = bookmarkNode.title;

                                                if (!(document.querySelector('.bookmark-edit-url') == null)) {
                                                    bookmarkNode.url = document.querySelector('.bookmark-edit-url').value;
                                                    updateObject.url = bookmarkNode.url;
                                                }

                                                browser.bookmarks.update(bookmarkNode.id, updateObject);

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
                        )
                    ) // required for weird issue involving dragging images
                ),
                m(`.bookmark-title${isSelected ? ' .selected' : ''}`, bookmarkNode.title)
            )));
        }
    }
};

export default Bookmark;