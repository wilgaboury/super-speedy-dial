import { useNavigate } from "@solidjs/router";
import { BiSolidCog } from "solid-icons/bi";
import { Component } from "solid-js";
import { Bookmarks } from "webextension-polyfill";
import Breadcrumb from "./Breadcrumb";
import { setShowSidebar } from "./Sidebar";
import { setAllowScroll } from "./Modal";

interface HeaderProps {
  readonly node: Bookmarks.BookmarkTreeNode;
}

const Header: Component<HeaderProps> = (props) => {
  const navigate = useNavigate();
  return (
    <div class="header-container">
      <Breadcrumb
        node={props.node}
        onNode={(n) => navigate(`/folder/${n.id}`)}
      />
      <div class="header-item">
        <div
          class="button borderless"
          onClick={() => {
            setAllowScroll(false);
            setShowSidebar(true);
          }}
        >
          <BiSolidCog size="20" />
        </div>
      </div>
    </div>
  );
};

export default Header;
