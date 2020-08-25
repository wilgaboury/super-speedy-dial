import Modal from './modal.js';
import { getBookmarkImage } from './utils.js';
import Loading from './loading.js';

function Bookmark() {
    let bookmarkNode = null;

    let isSelected = false;

    let showEditModal = false;

    let showDeleteDialog = false;

    let isMouseDown = false;
    let didMouseMove = true;

    let muuriItem;

    let imageBlob = null;
    let blobWidth = null;
    let blobHeight = null;

    let childImages = [];

    let showLoader = false;

    return {
        oninit: function(vnode) {
            bookmarkNode = vnode.attrs.bookmarkNode;

            if (bookmarkNode.type == 'bookmark') {
                getBookmarkImage(bookmarkNode, () => {
                    showLoader = true;
                    m.redraw();
                }).then(data => {
                    imageBlob = data.blob;
                    blobWidth = data.width;
                    blobHeight = data.height;
                    m.redraw();
                });
            } else {
                if (bookmarkNode.children.length > 0) {
                    childImages = new Array(Math.min(bookmarkNode.children.length, 4)).fill(null);
                    m.redraw();
                    for (let i = 0; i < Math.min(bookmarkNode.children.length, 4); i++) {
                        let capture_i = i;
                        getBookmarkImage(bookmarkNode.children[i]).then(data => {
                            childImages[capture_i] = data;
                            m.redraw();
                        });
                    }
                }
            }
        },

        oncreate: function(vnode) {
            muuriItem = vnode.attrs.muuriRef.value.add(vnode.dom, {layout: 'instant'});
            vnode.dom.addEventListener('click', (e) => e.preventDefault());
        },

        onremove: function(vnode) {
            vnode.attrs.muuriRef.value.remove(muuriItem);
        },

        view: function(vnode) {
            if (!(vnode.attrs.isSelected == null)) {
                isSelected = vnode.attrs.isSelected;
            }

            return m('.item', m('.item-content', m(`.bookmark-container`, {
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

                        if (!isSelected && drag)

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
                m(".bookmark-card", {
                        style: `
                            position: relative;
                            background-color: ${bookmarkNode.type == 'folder' ? 'rgba(0, 0, 0, 0.5);' : 'whitesmoke;'}
                            ${isSelected ? 'border: 2px solid #0390fc;' : ''}
                            ${(!(imageBlob == null) && blobHeight > 125 && blobWidth > 200) ? `
                                background-color: rgba(0, 0, 0, 0);
                                background-image: url(${URL.createObjectURL(imageBlob)});
                                background-repeat: no-repeat;
                                background-position: center;
                                background-attachment: fixed;
                                background-size: cover;
                            ` : ''}
                        `
                    },
                    function() {
                        if (bookmarkNode.type == 'bookmark') {
                            if (imageBlob == null) {
                                if (showLoader) {
                                    return m(Loading);
                                }
                            } else if (!(blobHeight > 125 && blobWidth > 200)) {
                                return m('img.website-image', {
                                    src: `${URL.createObjectURL(imageBlob)}`,
                                    height: `${blobHeight}`,
                                    width: `${blobWidth}`
                                });
                            }
                        } else {
                            if (childImages.length == 0) {
                                return m('img.folder-image', {src: 'icons/my_folder_empty.png', height: '125'});
                            } else {
                                return m('.folder-content',
                                    childImages.map(image => {
                                        return m('.folder-content-item', {
                                                style: `
                                                    ${image == null ? '' : `background-image: url(${URL.createObjectURL(image.blob)})`}
                                                `
                                            }
                                        );
                                    })
                                );
                            }
                        }

                        return m('.empty');
                    }(),
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