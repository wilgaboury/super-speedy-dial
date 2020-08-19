import Modal from './modal.js'

function Bookmark() {
    let bookmarkNode = null;

    let isSelected = false;

    let showModal;
    let tempTitle = null;
    let tempURL = null;

    let isMouseDown = false;
    let didMouseMove = true;

    let muuriItem;

    return {
        oncreate: function(vnode) {
            muuriItem = vnode.attrs.muuriRef.value.add(vnode.dom, {layout: 'instant'});
            vnode.dom.addEventListener('click', (e) => e.preventDefault());
            vnode.attrs.updateGridPadding();
            m.redraw();
        },

        onremove: function(vnode) {
            vnode.attrs.muuriRef.value.remove(muuriItem);
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
                    )
                ),
                m(`.bookmark-title${isSelected ? ' .selected' : ''}`, {title: bookmarkNode.title}, bookmarkNode.title)
            )));
        }
    }
};

export default Bookmark;