import { useNavigate } from "@solidjs/router";
import {
  BiRegularSearch,
  BiSolidBookmarkPlus,
  BiSolidCog,
  BiSolidFolderPlus,
} from "solid-icons/bi";
import { Component, Show, createSignal, onCleanup, useContext } from "solid-js";
import { Bookmarks } from "webextension-polyfill";
import Breadcrumb from "./Breadcrumb";
import { Modal, setAllowScroll } from "./Modal";
import { setShowSidebar } from "./Sidebar";
import Search from "./Search";
import { rootFolderId } from "./utils/bookmark";
import { isValidUrl, onEnterKey } from "./utils/assorted";
import { FolderStateContext } from "./Folder";
import { Toolbar } from "./Toolbar";

const buttonIconSize = 20;

interface HeaderProps {
  readonly node: Bookmarks.BookmarkTreeNode;
}

const Header: Component<HeaderProps> = (props) => {
  const navigate = useNavigate();

  const [showNewBookmark, setShowNewBookmark] = createSignal(false);
  const [showNewFolder, setShowNewFolder] = createSignal(false);

  const [bookmarkTitle, setBookmarkTitle] = createSignal("");
  const [bookmarkUrl, setBookmarkUrl] = createSignal("");
  const [folderTitle, setFolderTitle] = createSignal("");

  const folderState = useContext(FolderStateContext);

  function canNewBookmark() {
    return (
      bookmarkTitle().length > 0 &&
      (isValidUrl(bookmarkUrl()) || isValidUrl("https://" + bookmarkUrl()))
    );
  }

  function canNewFolder() {
    return folderTitle().length > 0;
  }

  function maybeAddHttps(url: string) {
    if (isValidUrl(url)) return url;
    else return "https://" + url;
  }

  function newBookmark() {
    if (!canNewBookmark()) return;

    folderState.createChild({
      title: bookmarkTitle(),
      url: maybeAddHttps(bookmarkUrl()),
    });

    setShowNewBookmark(false);
    setBookmarkTitle("");
    setBookmarkUrl("");
  }

  function newFolder() {
    if (!canNewFolder()) return;

    folderState.createChild({ title: folderTitle() });

    setShowNewFolder(false);
    setFolderTitle("");
  }

  let newBookmarkNameRef: HTMLInputElement | undefined;
  let newFolderNameRef: HTMLInputElement | undefined;

  return (
    <div class="header-container">
      <Breadcrumb
        node={props.node}
        onNode={(n) => navigate(`/folder/${n.id}`)}
      />
      <Toolbar />
      {/* <div class="header-item" style={{ display: "flex", gap: "5px" }}>
        <button class="borderless" onClick={() => setShowSearch(true)}>
          <BiRegularSearch size={`${buttonIconSize}px`} />
          <Search show={showSearch()} onClose={() => setShowSearch(false)} />
        </button>
        <Show when={props.node.id != rootFolderId}>
          <button
            class="borderless"
            onClick={() => {
              setShowNewBookmark(true);
              newBookmarkNameRef?.focus();
            }}
          >
            <BiSolidBookmarkPlus size={`${buttonIconSize}px`} />
            <Modal
              show={showNewBookmark()}
              onClose={() => setShowNewBookmark(false)}
            >
              <div class="modal-content" style={{ width: "325px" }}>
                <div>Name</div>
                <input
                  ref={newBookmarkNameRef}
                  type="text"
                  class="default"
                  value={bookmarkTitle()}
                  onInput={(e) => setBookmarkTitle(e.target.value)}
                  onKeyDown={onEnterKeyDown(newBookmark)}
                />
                <div>Url</div>
                <input
                  type="text"
                  class="default"
                  value={bookmarkUrl()}
                  onInput={(e) => setBookmarkUrl(e.target.value)}
                  onKeyDown={onEnterKeyDown(newBookmark)}
                />
              </div>
              <div class="modal-separator" />
              <div class="modal-buttons">
                <button
                  class={`save ${canNewBookmark() ? "" : "disabled"}`}
                  onClick={newBookmark}
                >
                  Create
                </button>
                <button onClick={() => setShowNewBookmark(false)}>
                  Cancel
                </button>
              </div>
            </Modal>
          </button>
          <button
            class="borderless"
            onClick={() => {
              setShowNewFolder(true);
              newFolderNameRef?.focus();
            }}
          >
            <BiSolidFolderPlus size={`${buttonIconSize}px`} />
            <Modal
              show={showNewFolder()}
              onClose={() => setShowNewFolder(false)}
            >
              <div class="modal-content" style={{ width: "325px" }}>
                <div>Name</div>
                <input
                  ref={newFolderNameRef}
                  type="text"
                  class="default"
                  value={folderTitle()}
                  onInput={(e) => setFolderTitle(e.target.value)}
                  onKeyDown={onEnterKeyDown(newFolder)}
                />
              </div>
              <div class="modal-separator" />
              <div class="modal-buttons">
                <button
                  class={`save ${canNewFolder() ? "" : "disabled"}`}
                  onClick={newFolder}
                >
                  Create
                </button>
                <button onClick={() => setShowNewFolder(false)}>Cancel</button>
              </div>
            </Modal>
          </button>
        </Show>
        <button
          class="borderless"
          onClick={() => {
            setAllowScroll(false);
            setShowSidebar(true);
          }}
        >
          <BiSolidCog size={`${buttonIconSize}px`} />
        </button>
      </div> */}
    </div>
  );
};

export default Header;
