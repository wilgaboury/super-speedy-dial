import Modal from './modal.js'

function Bookmark() {
    let bookmarkNode = null;

    let isSelected = false;

    let showEditModal = false;
    let tempTitle = null;
    let tempURL = null;

    let showDeleteDialog = false;

    let isMouseDown = false;
    let didMouseMove = true;

    let muuriItem;

    return {
        oncreate: function(vnode) {
            muuriItem = vnode.attrs.muuriRef.value.add(vnode.dom, {layout: 'instant'});
            vnode.dom.addEventListener('click', (e) => e.preventDefault());
        },

        onremove: function(vnode) {
            vnode.attrs.muuriRef.value.remove(muuriItem)//, {layout: 'instant'});
        },

        view: function(vnode) {
            bookmarkNode = vnode.attrs.bookmarkNode;

            if (!(vnode.attrs.isSelected == null)) {
                isSelected = vnode.attrs.isSelected;
            }

            return m('.item', m('.item-content', m('.bookmark-container', {
                    id: `bookmark_${vnode.attrs.key}`,
                    onmousedown: (event) => {
                        isSelected = true;
                        isMouseDown = true;
                        didMouseMove = false;
                    },
                    onmouseup: () => {
                        if (isSelected && !didMouseMove) {
                            vnode.attrs.onclick(bookmarkNode);
                        }

                        isSelected = false;
                        isMouseDown = false;
                        didMouseMove = true;
                    },
                    onmousemove: () => {
                        if (isSelected) {
                            didMouseMove = true;
                        }
                    },
                    onmouseover: () => {
                        if (isMouseDown) isSelected = true;
                    },
                    onmouseout: () => {
                        isSelected = false;
                    },
                },
                m(".bookmark-card", {style: 'position: relative; ' + (isSelected ? 'border: 2px solid #0390fc' : '')},
                    (bookmarkNode.type == 'folder' ? 
                        m('img.folder-image', {src: 'icons/folder.svg', height: '120'}) : 
                        m('img.website-image', {src: `https://api.statvoo.com/favicon/?url=${encodeURI(bookmarkNode.url)}`, height: '32'})),
                    m('.bookmark-cover', {style: 'height: 100%; width: 100%; position: absolute; z-index: 2'}, // cover needed to stop images from being selectable
                        m('.edit-bookmark-buttons-container',
                            m('.edit-bookmark-button.plastic-button', {
                                    style: 'position: relative',
                                    onclick: function(event) {
                                        showDeleteDialog = true;

                                        event.stopPropagation();
                                    },
                                    onmousedown: function(event) {
                                        event.stopPropagation();
                                    },
                                    onmouseup: function(event) {
                                        event.stopPropagation();
                                    }
                                },
                                m('span', {
                                    style: 'position: absolute; font-size: 14px; top: 5px; left: 7px'
                                }, m('i.fa.fa-times')),
                                showDeleteDialog && m(Modal, 
                                    m('.modal-content',
                                        m('div', `Are you sure you want to delete this ${bookmarkNode.type == 'folder' ? 'folder' : 'bookmark'}?`),
                                        m('.modal-button-container', {
                                            style: 'margin-top: 15px'
                                        },
                                        m('.flex-spacer'),
                                        m('.button.delete', {
                                            onclick: function() {
                                                if (bookmarkNode.type == 'folder') {
                                                    browser.bookmarks.removeTree(bookmarkNode.id);
                                                } else {
                                                    browser.bookmarks.remove(bookmarkNode.id);
                                                }

                                                vnode.attrs.ondelete();

                                                showDeleteDialog = false;
                                                m.redraw();
                                            }
                                        }, 'Delete'),
                                        m('.button.cancel', {
                                            onclick: function() {
                                                showDeleteDialog = false;
                                                m.redraw();
                                            }
                                        }, 'Cancel')
                                    )
                                    )    
                                )
                            ),
                            m('.edit-bookmark-button.plastic-button', {
                                    onclick: function(event) {
                                        console.log(bookmarkNode);
                                        showEditModal = true;
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
                                showEditModal && m(Modal,
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

                                                    if (bookmarkNode.type == 'bookmark') {
                                                        bookmarkNode.url = document.querySelector('.bookmark-edit-url').value;
                                                        updateObject.url = bookmarkNode.url;
                                                    }

                                                    browser.bookmarks.update(bookmarkNode.id, updateObject).then(function() {
                                                        if (bookmarkNode.type == 'bookmark') {
                                                            browser.bookmarks.get(bookmarkNode.id).then(function(bookmarks) {
                                                                let bookmark = bookmarks[0];
                                                                bookmarkNode.url = bookmark.url;
                                                                m.redraw();
                                                            });
                                                        }
                                                    })

                                                    showEditModal = false;
                                                    m.redraw();
                                                }
                                            }, 'Save'),
                                            m('.button.cancel', {
                                                onclick: function() {
                                                    showEditModal = false;
                                                    m.redraw();
                                                }
                                            }, 'Cancel')
                                        )
                                    )
                                )
                            )
                        )
                    )
                ),
                m(`.bookmark-title${isSelected ? ' .selected' : ''}`, {title: bookmarkNode.title}, bookmarkNode.title)
            )));
        }
    }
};

export default Bookmark;