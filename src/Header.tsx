import { useNavigate } from "@solidjs/router";
import { BiRegularSearch, BiSolidCog, BiSolidSearch } from "solid-icons/bi";
import { Component, createSignal } from "solid-js";
import { Bookmarks } from "webextension-polyfill";
import Breadcrumb from "./Breadcrumb";
import { setAllowScroll } from "./Modal";
import { setShowSidebar } from "./Sidebar";
import Search from "./Search";

const iconSize = 20;

interface HeaderProps {
  readonly node: Bookmarks.BookmarkTreeNode;
}

const Header: Component<HeaderProps> = (props) => {
  const navigate = useNavigate();

  const [showSearch, setShowSearch] = createSignal(false);

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
        {/* <Show when={props.node.id != rootFolderId}>
          <div class="button borderless" onClick={() => {}}>
            <BiSolidBookmarkPlus size={`${iconSize}px`} />
          </div>
          <div class="button borderless" onClick={() => {}}>
            <BiSolidFolderPlus size={`${iconSize}px`} />
          </div>
        </Show> */}
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
