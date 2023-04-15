import { Navigator, useNavigate } from "@solidjs/router";
import {
  BiRegularCamera,
  BiRegularEdit,
  BiRegularFolderOpen,
  BiRegularImageAlt,
  BiRegularLinkExternal,
  BiRegularTrash,
  BiRegularWindowOpen,
} from "solid-icons/bi";
import {
  Component,
  For,
  Match,
  ParentComponent,
  Show,
  Switch,
  createResource,
  createSignal,
  useContext,
} from "solid-js";
import browser, { Bookmarks, bookmarks } from "webextension-polyfill";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ctxMenuIconSize,
} from "./ContextMenu";
import { GridItemContext } from "./DragGrid";
import { FolderStateContext } from "./Folder";
import Loading from "./Loading";
import { Modal } from "./Modal";
import folderTileIcon from "./assets/folder.svg";
import {
  MetaBlob,
  getSubTreeAsList,
  retrievePageScreenshot,
  retrieveTileImage,
} from "./utils";

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

function openBookmarkNewTab(
  node: Bookmarks.BookmarkTreeNode,
  focus: boolean = false
) {
  const win = window.open(node.url, "_blank");
  if (focus) win?.focus();
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
  readonly backgroundColor: string;
  readonly onContextMenu?: (e: MouseEvent) => void;
}

const TileCard: ParentComponent<TileCardProps> = (props) => {
  const gridItem = useContext(GridItemContext);

  return (
    <div
      ref={gridItem.handleRef}
      class={`bookmark-card ${gridItem.selected() ? "selected" : ""}`}
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
  readonly onReloadImage: () => void;
  readonly onCaptureScreenshot: () => void;
}

const BookmarkTileContextMenu: Component<BookmarkTileContextMenuProps> = (
  props
) => {
  const folderState = useContext(FolderStateContext);
  const gridItem = useContext(GridItemContext);

  const [title, setTitle] = createSignal(props.title);
  const [url, setUrl] = createSignal(props.node.url ?? "");

  const [showEditModal, setShowEditModal] = createSignal(false);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);

  function editOnKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") editSave();
  }

  function editSave() {
    folderState.editChild(gridItem.idx(), {
      ...props.node,
      title: title(),
      url: url(),
    });
    setShowEditModal(false);
  }

  return (
    <>
      <ContextMenuItem
        icon={<BiRegularEdit size={ctxMenuIconSize} />}
        onClick={() => setShowEditModal(true)}
      >
        Edit
        <Modal show={showEditModal()}>
          <div class="modal-content" style={{ width: "325px" }}>
            <div>Name</div>
            <input
              type="text"
              value={props.title}
              onInput={(e) => setTitle(e.target.value)}
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
            <div class="button" onClick={() => setShowEditModal(false)}>
              Cancel
            </div>
          </div>
        </Modal>
      </ContextMenuItem>
      <ContextMenuItem
        icon={<BiRegularTrash size={ctxMenuIconSize} />}
        onClick={() => setShowDeleteModal(true)}
      >
        Delete
        <Modal show={showDeleteModal()}>
          <div class="modal-content" style={{ "max-width": "550px" }}>
            Confirm you would like to delete {props.node.title}
          </div>
          <div class="modal-separator" />
          <div class="modal-buttons">
            <div
              class="button delete"
              onClick={() => {
                setShowDeleteModal(false);
                gridItem.onDelete();
                bookmarks.remove(props.node.id);
              }}
            >
              Delete
            </div>
            <div class="button" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </div>
          </div>
        </Modal>
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
  readonly title: string;
  readonly onRetitle: (title: string) => void;
}

const BookmarkTile: Component<BookmarkTileProps> = (props) => {
  const [image, { mutate: setImage }] = createResource<MetaBlob>(() =>
    retrieveTileImage(props.node, () => setShowLoader(true))
  );
  const [showLoader, setShowLoader] = createSignal(false);

  setTimeout(() => setShowLoader(true), 250);

  const [onContext, setOnContext] = createSignal<MouseEvent>();

  return (
    <TileCard backgroundColor={"whitesmoke"} onContextMenu={setOnContext}>
      <ContextMenu event={onContext()}>
        <BookmarkTileContextMenu
          node={props.node}
          title={props.title}
          onRetitle={props.onRetitle}
          onReloadImage={() => {
            setImage(undefined);
            setShowLoader(true);
            retrieveTileImage(props.node, () => {}, true).then((blob) => {
              setImage(blob);
            });
          }}
          onCaptureScreenshot={() => {
            setImage(undefined);
            setShowLoader(true);
            retrievePageScreenshot(props.node.id, props.node.url).then(
              setImage
            );
          }}
        />
      </ContextMenu>
      <Show when={image()} fallback={showLoader() ? <Loading /> : null}>
        {(nnImageAccessor) => {
          const nnImage = nnImageAccessor();
          if (
            nnImage.size != null &&
            (nnImage.size.height <= 64 ||
              nnImage.size.width <= 64 ||
              nnImage.size.height / nnImage.size.width < 0.5)
          ) {
            return (
              <img
                class="website-image"
                src={nnImage.url}
                height={nnImage.size.height}
                width={nnImage.size.width}
                draggable={false}
              />
            );
          } else {
            return (
              <img
                src={nnImage.url}
                style={{
                  height: "100%",
                  width: "100%",
                  "object-fit": "cover",
                }}
                draggable={false}
              />
            );
          }
        }}
      </Show>
    </TileCard>
  );
};

interface FolderTileContextMenuProps extends Noded {
  readonly title: string;
  readonly onRetitle: (name: string) => void;
}

const FolderTileContextMenu: Component<FolderTileContextMenuProps> = (
  props
) => {
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [showChildrenModal, setShowChildrenModal] = createSignal(false);
  let openChildren: ReadonlyArray<Bookmarks.BookmarkTreeNode> = [];

  function editOnKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") editSave();
  }

  function editSave() {
    props.node.title = props.title;
    browser.bookmarks.update(props.node.id, {
      title: props.title,
    });
    setShowEditModal(false);
  }

  const navigator = useNavigate();

  return (
    <>
      <ContextMenuItem
        icon={<BiRegularEdit size={ctxMenuIconSize} />}
        onClick={() => setShowEditModal(true)}
      >
        Edit
        <Modal show={showEditModal()}>
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
          </div>
          <div class="modal-separator" />
          <div class="modal-buttons">
            <div class="button save" onClick={editSave}>
              Save
            </div>
            <div class="button" onClick={() => setShowEditModal(false)}>
              Cancel
            </div>
          </div>
        </Modal>
      </ContextMenuItem>
      <ContextMenuItem
        icon={<BiRegularLinkExternal size={ctxMenuIconSize} />}
        onClick={() => openFolder(navigator, props.node)}
      >
        Open
      </ContextMenuItem>
      <ContextMenuItem
        icon={<BiRegularWindowOpen size={ctxMenuIconSize} />}
        onClick={() => openFolderNewTab(props.node)}
      >
        Open in New Tab
      </ContextMenuItem>
      <ContextMenuItem
        icon={<BiRegularFolderOpen size={ctxMenuIconSize} />}
        onClick={async () => {
          const bookmarks = await getSubTreeAsList(props.node.id);
          if (bookmarks.length < 8) {
            for (const bookmark of bookmarks) {
              openBookmarkNewTab(bookmark, false);
            }
          } else {
            openChildren = bookmarks;
            setShowChildrenModal(true);
          }
        }}
      >
        Open Children
        <Modal show={showChildrenModal()}>
          <div class="modal-content">
            Confirm that you would like to open {openChildren.length} tabs
          </div>
          <div class="modal-separator" />
          <div class="modal-buttons">
            <div
              class="button save"
              onClick={() => {
                for (const bookmark of openChildren) {
                  openBookmarkNewTab(bookmark, false);
                }
                setShowChildrenModal(false);
              }}
            >
              Save
            </div>
            <div class="button" onClick={() => setShowChildrenModal(false)}>
              Cancel
            </div>
          </div>
        </Modal>
      </ContextMenuItem>
    </>
  );
};

interface FolderTileProps extends Noded {
  readonly title: string;
  readonly onRetitle: (title: string) => void;
}

const FolderTile: Component<FolderTileProps> = (props) => {
  const [showLoader, setShowLoadaer] = createSignal(false);
  const [images] = createResource<ReadonlyArray<MetaBlob>>(() =>
    browser.bookmarks
      .getChildren(props.node.id)
      .then((children) =>
        Promise.all(
          children
            .slice(0, 4)
            .map((n) => retrieveTileImage(n, () => setShowLoadaer(true)))
        )
      )
  );

  const [onContext, setOnContext] = createSignal<MouseEvent>();

  return (
    <TileCard
      backgroundColor="rgba(255, 255, 255, 0.5)"
      onContextMenu={setOnContext}
    >
      <ContextMenu event={onContext()}>
        <FolderTileContextMenu
          node={props.node}
          title={props.title}
          onRetitle={props.onRetitle}
        />
      </ContextMenu>
      <Show
        when={images() != null}
        fallback={showLoader() ? <Loading /> : null}
      >
        <Switch>
          <Match when={images()!.length == 0}>
            <img src={folderTileIcon} height="150" draggable={false} />
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

const SeparatorTile: Component = () => {
  return <TileCard backgroundColor="rgba(255, 255, 255, 0.5)" />;
};

const Tile: Component<Noded> = (props) => {
  const gridItem = useContext(GridItemContext);
  const folderState = useContext(FolderStateContext);

  return (
    <div
      class={`item ${gridItem.selected() ? "selected" : ""}`}
      ref={gridItem.containerRef}
    >
      <div class="bookmark-container">
        <Switch>
          <Match when={props.node.type === "bookmark"}>
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
          <Match when={props.node.type === "folder"}>
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
          <Match when={props.node.type === "separator"}>
            <SeparatorTile />
          </Match>
        </Switch>
        <div class={`bookmark-title${gridItem.selected() ? " selected" : ""}`}>
          {props.node.title}
        </div>
      </div>
    </div>
  );
};

export default Tile;
