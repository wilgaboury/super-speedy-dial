import { useNavigate, Navigator } from "@solidjs/router";
import {
  children,
  Component,
  createResource,
  createSignal,
  For,
  Match,
  ParentComponent,
  Show,
  Switch,
} from "solid-js";
import browser, { Bookmarks } from "webextension-polyfill";
import Loading from "./Loading";
import {
  addUrlToBlob,
  retrievePageScreenshotUri,
  retrieveTileImage,
  SizedUrl,
} from "./utils";
import emptyFolderTileIcon from "./assets/folder_empty.png";
import seperatorTileIcon from "./assets/separator.png";
import {
  ContextMenuItem,
  ContextMenuSeparator,
  contextMenuState,
  ctxMenuIconSize,
} from "./ContextMenu";
import {
  BiRegularCamera,
  BiRegularEdit,
  BiRegularImageAlt,
  BiRegularLinkExternal,
  BiRegularTrash,
  BiRegularWindowOpen,
} from "solid-icons/bi";
import { modalState } from "./Modal";

function openFolder(navigate: Navigator, node: Bookmarks.BookmarkTreeNode) {
  navigate(`/folder/${node.id}`);
}

function openFolderNewTab(node: Bookmarks.BookmarkTreeNode) {
  const win = window.open(`#/folder/${node.id}`, "_blank");
  win?.focus();
}

function openBookmark(node: Bookmarks.BookmarkTreeNode) {
  if (node.url != null) window.location.href = node.url;
}

function openBookmarkNewTab(node: Bookmarks.BookmarkTreeNode) {
  const win = window.open(node.url, "_blank");
  win?.focus();
}

export function openTile(
  navigate: Navigator,
  node: Bookmarks.BookmarkTreeNode,
  event: MouseEvent
) {
  if (node.type === "separator") {
    return;
  } else if (node.type === "folder") {
    if (event.ctrlKey) {
      openFolderNewTab(node);
    } else {
      openFolder(navigate, node);
    }
  } else if (node.type === "bookmark") {
    if (event.ctrlKey) {
      openBookmarkNewTab(node);
    } else if (node.url != null) {
      openBookmark(node);
    }
  }
}

interface Noded {
  readonly node: Bookmarks.BookmarkTreeNode;
}

interface TileCardProps {
  readonly selected: boolean;
  readonly handleRef: (el: HTMLElement) => void;
  readonly backgroundColor: string;
  readonly onContextMenu?: (e: MouseEvent) => void;
}

const TileCard: ParentComponent<TileCardProps> = (props) => {
  return (
    <div
      ref={props.handleRef}
      class={`bookmark-card ${props.selected ? "selected" : ""}`}
      style={{
        position: "relative",
        "background-color": props.backgroundColor,
      }}
      onContextMenu={(e) => props.onContextMenu && props.onContextMenu(e)}
    >
      {props.children}
    </div>
  );
};

interface BookmarkTileContextMenuProps extends Noded {
  readonly title: string;
  readonly onRetitle: (name: string) => void;
  readonly onDelete: () => void;
  readonly onReloadImage: () => void;
  readonly onCaptureScreenshot: () => void;
}

const BookmarkTileContextMenu: Component<BookmarkTileContextMenuProps> = (
  props
) => {
  const [url, setUrl] = createSignal(props.node.url ?? "");

  function editOnKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") editSave();
  }

  function editSave() {
    props.node.title = props.title;
    props.node.url = url();
    browser.bookmarks.update(props.node.id, {
      title: props.title,
      url: url(),
    });
    modalState.close();
  }

  return (
    <>
      <ContextMenuItem
        icon={<BiRegularEdit size={ctxMenuIconSize} />}
        onClick={() =>
          modalState.open(
            <>
              <div class="modal-content" style={{ width: "325px" }}>
                <div>Name</div>
                <input
                  type="text"
                  value={props.title}
                  onInput={(e) =>
                    props.onRetitle && props.onRetitle(e.target.value)
                  }
                  onKeyDown={editOnKeyDown}
                />
                <div>Url</div>
                <input
                  type="text"
                  value={url()}
                  onInput={(e) => setUrl(e.target.value)}
                  onKeyDown={editOnKeyDown}
                />
              </div>
              <div class="modal-separator" />
              <div class="modal-buttons">
                <div class="button save" onClick={editSave}>
                  Save
                </div>
                <div class="button" onClick={() => modalState.close()}>
                  Cancel
                </div>
              </div>
            </>
          )
        }
      >
        Edit
      </ContextMenuItem>
      <ContextMenuItem
        icon={<BiRegularTrash size={ctxMenuIconSize} />}
        onClick={() =>
          modalState.open(
            <>
              <div class="modal-content" style={{ "max-width": "550px" }}>
                Confirm you would like to delete {props.node.title}
              </div>
              <div class="modal-separator" />
              <div class="modal-buttons">
                <div
                  class="button delete"
                  onClick={() => {
                    if (props.onDelete != null) props.onDelete();
                    modalState.close();
                  }}
                >
                  Delete
                </div>
                <div class="button" onClick={() => modalState.close()}>
                  Cancel
                </div>
              </div>
            </>
          )
        }
      >
        Delete
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        icon={<BiRegularLinkExternal size={ctxMenuIconSize} />}
        onClick={() => openBookmark(props.node)}
      >
        Open
      </ContextMenuItem>
      <ContextMenuItem
        icon={<BiRegularWindowOpen size={ctxMenuIconSize} />}
        onClick={() => openBookmarkNewTab(props.node)}
      >
        Open in New Tab
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem
        icon={<BiRegularImageAlt size={ctxMenuIconSize} />}
        onClick={props.onReloadImage}
      >
        Reload Image
      </ContextMenuItem>
      <ContextMenuItem
        icon={<BiRegularCamera size={ctxMenuIconSize} />}
        onClick={props.onCaptureScreenshot}
      >
        Use Screenshot
      </ContextMenuItem>
    </>
  );
};

interface BookmarkTileProps extends Noded {
  readonly handleRef: (el: HTMLElement) => void;
  readonly selected: boolean;
  readonly onDelete: () => void;
  readonly title: string;
  readonly onRetitle: (title: string) => void;
}

const BookmarkTile: Component<BookmarkTileProps> = (props) => {
  const [image, { mutate: setImage }] = createResource<SizedUrl>(() =>
    retrieveTileImage(props.node, () => setShowLoader(true)).then((blob) =>
      addUrlToBlob(blob)
    )
  );
  const [showLoader, setShowLoader] = createSignal(false);

  setTimeout(() => setShowLoader(true), 250);

  return (
    <TileCard
      selected={props.selected}
      handleRef={props.handleRef}
      backgroundColor={"whitesmoke"}
      onContextMenu={(e) => {
        contextMenuState.open(
          e,
          <BookmarkTileContextMenu
            node={props.node}
            onDelete={props.onDelete}
            title={props.title}
            onRetitle={props.onRetitle}
            onReloadImage={() => {
              setImage(undefined);
              setShowLoader(true);
              retrieveTileImage(props.node, () => {}, true).then((blob) => {
                setImage(addUrlToBlob(blob));
              });
            }}
            onCaptureScreenshot={() => {
              setImage(undefined);
              setShowLoader(true);
              retrievePageScreenshotUri(props.node.id, props.node.url).then(
                setImage
              );
            }}
          />
        );
      }}
    >
      <Show when={image()} fallback={showLoader() ? <Loading /> : null}>
        {(nnImage) =>
          nnImage().height <= 125 || nnImage().width <= 200 ? (
            <img
              class="website-image"
              src={nnImage()!.url}
              height={nnImage()!.height}
              width={nnImage()!.width}
              draggable={false}
            />
          ) : (
            <img
              src={nnImage()!.url}
              style={{
                height: "100%",
                width: "100%",
                "object-fit": "cover",
              }}
              draggable={false}
            />
          )
        }
      </Show>
    </TileCard>
  );
};

interface FolderTileProps extends Noded {
  readonly selected: boolean;
  readonly handleRef: (el: HTMLElement) => void;
}

const FolderTile: Component<FolderTileProps> = (props) => {
  const [images, setImages] = createSignal<ReadonlyArray<SizedUrl>>();
  const [showLoader, setShowLoadaer] = createSignal(false);

  browser.bookmarks.getChildren(props.node.id).then((children) => {
    Promise.all(
      children
        .slice(0, 4)
        .map((n) => retrieveTileImage(n, () => setShowLoadaer(true)))
    ).then((blobs) => setImages(blobs.map(addUrlToBlob)));
  });

  return (
    <TileCard
      selected={props.selected}
      handleRef={props.handleRef}
      backgroundColor="rgba(255, 255, 255, 0.5)"
    >
      <Show
        when={images() != null}
        fallback={showLoader() ? <Loading /> : null}
      >
        <Switch>
          <Match when={images()!.length == 0}>
            <img src={emptyFolderTileIcon} height="150" draggable={false} />
          </Match>
          <Match when={images()!.length > 0}>
            <div class="folder-content">
              <For each={images()}>
                {(image) => (
                  <div class="folder-content-item">
                    <img
                      src={image.url}
                      style="height: 100%; width: 100%; object-fit: cover"
                      draggable={false}
                    />
                  </div>
                )}
              </For>
            </div>
          </Match>
        </Switch>
      </Show>
    </TileCard>
  );
};

interface SeparatorTileProps extends Noded {
  readonly handleRef: (el: HTMLElement) => void;
  readonly selected: boolean;
}

const SeparatorTile: Component<SeparatorTileProps> = (props) => {
  return (
    <TileCard
      selected={props.selected}
      handleRef={props.handleRef}
      backgroundColor={"whitesmoke"}
    >
      <img
        src={seperatorTileIcon}
        style={{
          height: "100%",
          width: "100%",
          "object-fit": "cover",
        }}
        draggable={false}
      />
    </TileCard>
  );
};

interface TileProps extends Noded {
  selected: boolean;
  containerRef: (el: HTMLElement) => void;
  handleRef: (el: HTMLElement) => void;
  onDelete: () => void;
}

const Tile: Component<TileProps> = (props) => {
  const [title, setTitle] = createSignal(props.node.title);

  return (
    <div
      class={`item ${props.selected ? "selected" : ""}`}
      ref={props.containerRef}
    >
      <div class="bookmark-container">
        <Switch>
          <Match when={props.node.type === "bookmark"}>
            <BookmarkTile
              node={props.node}
              onDelete={props.onDelete}
              selected={props.selected}
              handleRef={props.handleRef}
              title={title()}
              onRetitle={setTitle}
            />
          </Match>
          <Match when={props.node.type === "folder"}>
            <FolderTile
              node={props.node}
              selected={props.selected}
              handleRef={props.handleRef}
            />
          </Match>
          <Match when={props.node.type === "separator"}>
            <SeparatorTile
              node={props.node}
              selected={props.selected}
              handleRef={props.handleRef}
            />
          </Match>
        </Switch>
        <div class={`bookmark-title${props.selected ? " selected" : ""}`}>
          {title()}
        </div>
      </div>
    </div>
  );
};

export default Tile;
