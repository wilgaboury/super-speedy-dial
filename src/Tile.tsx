import { Navigator } from "@solidjs/router";
import {
  Component,
  Match,
  ParentComponent,
  Switch,
  useContext,
} from "solid-js";
import { Bookmarks } from "webextension-polyfill";
import { GridItemContext } from "./DragGrid";
import { FolderStateContext } from "./Folder";
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
  const gridItem = useContext(GridItemContext);
  const [settings] = useContext(SettingsContext);

  return (
    <div
      class={`bookmark-card-container ${gridItem.selected() ? "selected" : ""}`}
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
        ref={gridItem.handleRef}
        class="bookmark-card"
        onContextMenu={(e) => props.onContextMenu && props.onContextMenu(e)}
      >
        {props.children}
      </div>
    </div>
  );
};

const SeparatorTile: Component = () => {
  return <TileCard backgroundColor="rgba(var(--background-rgb), 0.5)" />;
};

interface TileProps {
  readonly node: Bookmarks.BookmarkTreeNode;
  readonly width: number;
  readonly height: number;
}

const Tile: Component<TileProps> = (props) => {
  const gridItem = useContext(GridItemContext);
  const folderState = useContext(FolderStateContext);
  const [settings] = useContext(SettingsContext);

  return (
    <div
      class={`grid-item ${gridItem.selected() ? "selected" : ""}`}
      style={{ width: `${props.width}px`, height: `${props.height}px` }}
      ref={gridItem.containerRef}
    >
      <div
        class="bookmark-container"
        style={{ padding: `${Math.round(settings.tileGap / 2)}px` }}
      >
        <Switch>
          <Match when={isBookmark(props.node)}>
            <BookmarkTile
              node={props.node}
              title={props.node.title}
              onRetitle={(title) =>
                folderState.editChild(gridItem.idx(), {
                  ...props.node,
                  title,
                })
              }
            />
          </Match>
          <Match when={isFolder(props.node)}>
            <FolderTile
              node={props.node}
              title={props.node.title}
              onRetitle={(title) =>
                folderState.editChild(gridItem.idx(), {
                  ...props.node,
                  title,
                })
              }
            />
          </Match>
          <Match when={isSeparator(props.node)}>
            <SeparatorTile />
          </Match>
        </Switch>
        <div
          class={`bookmark-title${gridItem.selected() ? " selected" : ""}`}
          style={{
            padding: `${textPadding}px`,
            "font-size": `${settings.tileFont}px`,
          }}
        >
          {isSeparator(props.node) ? "Separator" : props.node.title}
        </div>
      </div>
    </div>
  );
};

export default Tile;
