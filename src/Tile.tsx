import { Navigator } from "@solidjs/router";
import {
  Component,
  Match,
  ParentComponent,
  Switch,
  useContext,
} from "solid-js";
import { Bookmarks } from "webextension-polyfill";
import { FolderSortableItemContext, FolderStateContext } from "./Folder";
import { SettingsContext } from "./settings";
import { openFolder, openFolderNewTab, openUrlClick } from "./utils/assorted";
import BookmarkTile from "./BookmarkTile";
import FolderTile from "./FolderTile";
import { isBookmark, isFolder, isSeparator } from "./utils/bookmark";

export const tileTextGap = 8;
export const textPadding = 4;

export function openTile(
  navigate: Navigator,
  node: Bookmarks.BookmarkTreeNode,
  newTab: boolean
) {
  if (isSeparator(node)) {
    return;
  } else if (isFolder(node)) {
    if (newTab) {
      openFolderNewTab(node);
    } else {
      openFolder(navigate, node);
    }
  } else if (isBookmark(node)) {
    openUrlClick(node.url, newTab);
  }
}

interface TileCardProps {
  readonly backgroundColor: string;
  readonly onContextMenu?: (e: MouseEvent) => void;
}

export const TileCard: ParentComponent<TileCardProps> = (props) => {
  const folderItem = useContext(FolderSortableItemContext);
  const [settings] = useContext(SettingsContext);

  return (
    <div
      class={`bookmark-card-container ${
        folderItem.isMouseDown() ? "selected" : ""
      }`}
      style={{
        width: `${settings.tileWidth}px`,
        height: `${settings.tileHeight}px`,
        "margin-bottom": `${tileTextGap}px`,
      }}
    >
      <div
        class="bookmark-card-background"
        style={{ "background-color": props.backgroundColor }}
      />
      <div
        ref={folderItem.handleRef}
        class="bookmark-card"
        onContextMenu={(e) => {
          if (props.onContextMenu != null) props.onContextMenu(e);
        }}
      >
        {props.children}
      </div>
    </div>
  );
};

const SeparatorTile: Component = () => {
  return <TileCard backgroundColor="rgba(var(--background-rgb), 0.5)" />;
};

const Tile: Component = () => {
  const folderItem = useContext(FolderSortableItemContext);
  const folderState = useContext(FolderStateContext);
  const [settings] = useContext(SettingsContext);

  return (
    <div
      class={`grid-item ${folderItem.isMouseDown() ? "selected" : ""}`}
      ref={folderItem.itemRef}
    >
      <div
        class="bookmark-container"
        style={{ padding: `${Math.round(settings.tileGap / 2)}px` }}
      >
        <Switch>
          <Match when={isSeparator(folderItem.item)}>
            <SeparatorTile />
          </Match>
          <Match when={isBookmark(folderItem.item)}>
            <BookmarkTile />
          </Match>
          <Match when={isFolder(folderItem.item)}>
            <FolderTile />
          </Match>
        </Switch>
        <div
          class={`bookmark-title${folderItem.isMouseDown() ? " selected" : ""}`}
          style={{
            "max-width": `${settings.tileWidth}px`,
            padding: `${textPadding}px`,
            "font-size": `${settings.tileFont}px`,
          }}
        >
          {isSeparator(folderItem.item) ? "Separator" : folderItem.item.title}
        </div>
      </div>
    </div>
  );
};

export default Tile;
