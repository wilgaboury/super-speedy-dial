import { useNavigate } from "@solidjs/router";
import {
  BiRegularSearch,
  BiSolidBookmarkPlus,
  BiSolidCog,
  BiSolidFolderPlus,
} from "solid-icons/bi";
import { Component, Show, createSignal, useContext } from "solid-js";
import { Bookmarks } from "webextension-polyfill";
import Breadcrumb from "./Breadcrumb";
import { Modal, setAllowScroll } from "./Modal";
import { setShowSidebar } from "./Sidebar";
import Search from "./Search";
import { rootFolderId } from "./utils/bookmark";
import { isValidUrl, onEnterKeyDown } from "./utils/assorted";
import { FolderStateContext } from "./Folder";

const iconSize = 20;

interface HeaderProps {
  readonly node: Bookmarks.BookmarkTreeNode;
}

const Header: Component<HeaderProps> = (props) => {
  const navigate = useNavigate();

  const [showSearch, setShowSearch] = createSignal(false);

  document.addEventListener("keydown", (e) => {
    if (e.key == "F3" || (e.ctrlKey && e.key == "f")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      setShowSearch(true);
    }
  });

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
      <div class="header-item" style={{ display: "flex", gap: "5px" }}>
        <div class="button borderless" onClick={() => setShowSearch(true)}>
          <BiRegularSearch size={`${iconSize}px`} />
          <Search show={showSearch()} onClose={() => setShowSearch(false)} />
        </div>
        <Show when={props.node.id != rootFolderId}>
          <div
            class="button borderless"
            onClick={() => {
              setShowNewBookmark(true);
              newBookmarkNameRef?.focus();
            }}
          >
            <BiSolidBookmarkPlus size={`${iconSize}px`} />
            <Modal show={showNewBookmark()}>
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
                <div
                  class={`button save ${canNewBookmark() ? "" : "disabled"}`}
                  onClick={newBookmark}
                >
                  Create
                </div>
                <div class="button" onClick={() => setShowNewBookmark(false)}>
                  Cancel
                </div>
              </div>
            </Modal>
          </div>
          <div
            class="button borderless"
            onClick={() => {
              setShowNewFolder(true);
              newFolderNameRef?.focus();
            }}
          >
            <BiSolidFolderPlus size={`${iconSize}px`} />
            <Modal show={showNewFolder()}>
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
                <div
                  class={`button save ${canNewFolder() ? "" : "disabled"}`}
                  onClick={newFolder}
                >
                  Create
                </div>
                <div class="button" onClick={() => setShowNewFolder(false)}>
                  Cancel
                </div>
              </div>
            </Modal>
          </div>
        </Show>
        <div
          class="button borderless"
          onClick={() => {
            setAllowScroll(false);
            setShowSidebar(true);
          }}
        >
          <BiSolidCog size={`${iconSize}px`} />
        </div>
      </div>
    </div>
  );
};

export default Header;
