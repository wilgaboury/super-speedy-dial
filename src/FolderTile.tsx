import { useNavigate } from "@solidjs/router";
import {
  BiRegularEdit,
  BiRegularFolderOpen,
  BiRegularLinkExternal,
  BiRegularMinusBack,
  BiRegularTrash,
  BiRegularWindowOpen,
  BiRegularWindows,
} from "solid-icons/bi";
import {
  Component,
  For,
  Match,
  Show,
  Switch,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";
import { Bookmarks, bookmarks } from "webextension-polyfill";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ctxMenuIconSize,
} from "./ContextMenu";
import { FolderSortableItemContext, FolderStateContext } from "./Folder";
import CircleLoader from "./CircleLoader";
import { Modal } from "./Modal";
import folderTileIcon from "./assets/folder.svg";
import { SettingsContext } from "./settings";
import {
  getObjectUrl,
  openFolder,
  openFolderBackground,
  openFolderNewTab,
  openFolderWindow,
  openUrlBackground,
} from "./utils/assorted";
import { getSubTreeAsList, isBookmark } from "./utils/bookmark";
import { TileCard } from "./Tile";
import { defaultTileBackgroundColor } from "./BookmarkTile";
import { bookmarkVisual, isMemoBookmarkVisualMeta } from "./utils/visual";

const FolderTileContextMenu: Component = () => {
  const folderState = useContext(FolderStateContext);
  const folderItem = useContext(FolderSortableItemContext);

  const [showEditModal, setShowEditModal] = createSignal(false);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  const [showChildrenModal, setShowChildrenModal] = createSignal(false);
  const [title, setTitle] = createSignal(folderItem.item.title);

  let children: ReadonlyArray<Bookmarks.BookmarkTreeNode> = [];
  let deleteHeld = false;

  function editOnKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") editSave();
  }

  function editSave() {
    folderState.editChild(folderItem.idx(), {
      ...folderItem.item,
      title: title(),
    });
    setShowEditModal(false);
  }

  const navigator = useNavigate();

  let editNameRef: HTMLInputElement | undefined;

  return (
    <>
      <Show when={folderItem.item.unmodifiable == null}>
        <ContextMenuItem
          icon={<BiRegularEdit size={ctxMenuIconSize} />}
          onClick={() => {
            setShowEditModal(true);
            editNameRef?.focus();
          }}
        >
          Edit
          <Modal show={showEditModal()} onClose={() => setShowEditModal(false)}>
            <div class="modal-content" style={{ width: "325px" }}>
              <div>Name</div>
              <input
                ref={editNameRef}
                type="text"
                class="default"
                value={folderItem.item.title}
                onInput={(e) => setTitle(e.target.value)}
                onKeyDown={editOnKeyDown}
              />
            </div>
            <div class="modal-separator" />
            <div class="modal-buttons">
              <button class="save" onClick={editSave}>
                Save
              </button>
              <button onClick={() => setShowEditModal(false)}>Cancel</button>
            </div>
          </Modal>
        </ContextMenuItem>
        <ContextMenuItem
          icon={<BiRegularTrash size={ctxMenuIconSize} />}
          onClick={async () => {
            children = (await getSubTreeAsList(folderItem.item.id)).filter(
              isBookmark
            );
            setShowDeleteModal(true);
          }}
        >
          Delete
          <Modal
            show={showDeleteModal()}
            onClose={() => setShowDeleteModal(false)}
          >
            <div class="modal-content" style={{ "max-width": "550px" }}>
              Confirm you would like to delete the folder "
              {folderItem.item.title}"
              {children.length > 0
                ? ` and the ${children.length} bookmark${
                    children.length > 1 ? "s" : ""
                  } inside (press and hold)`
                : ""}
            </div>
            <div class="modal-separator" />
            <div class="modal-buttons">
              <button
                class={`delete ${children.length > 0 ? "hold" : ""}`}
                onClick={() => {
                  if (children.length == 0 || deleteHeld) {
                    setShowDeleteModal(false);
                    folderState.remove(folderItem.idx());
                    bookmarks.removeTree(folderItem.item.id);
                  }
                }}
                onAnimationStart={() => (deleteHeld = false)}
                onAnimationEnd={() => (deleteHeld = true)}
              >
                Delete
              </button>
              <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
            </div>
          </Modal>
        </ContextMenuItem>
        <ContextMenuSeparator />
      </Show>
      <ContextMenuItem
        icon={<BiRegularLinkExternal size={ctxMenuIconSize} />}
        onClick={() => openFolder(navigator, folderItem.item)}
      >
        Open
      </ContextMenuItem>
      <ContextMenuItem
        icon={<BiRegularWindowOpen size={ctxMenuIconSize} />}
        onClick={() => openFolderNewTab(folderItem.item)}
      >
        Open New Tab
      </ContextMenuItem>
      <ContextMenuItem
        icon={<BiRegularMinusBack size={ctxMenuIconSize} />}
        onClick={() => openFolderBackground(folderItem.item)}
      >
        Open Background
      </ContextMenuItem>
      <ContextMenuItem
        icon={<BiRegularWindows size={ctxMenuIconSize} />}
        onClick={() => openFolderWindow(folderItem.item)}
      >
        Open Window
      </ContextMenuItem>
      <ContextMenuItem
        icon={<BiRegularFolderOpen size={ctxMenuIconSize} />}
        onClick={async () => {
          children = (await getSubTreeAsList(folderItem.item.id)).filter(
            (n) => n.url != null
          );
          if (children.length < 8) {
            for (const bookmark of children) {
              openUrlBackground(bookmark.url);
            }
          } else {
            setShowChildrenModal(true);
          }
        }}
      >
        Open Children
        <Modal
          show={showChildrenModal()}
          onClose={() => setShowChildrenModal(false)}
        >
          <div class="modal-content">
            Confirm you would like to open {children.length} tabs
          </div>
          <div class="modal-separator" />
          <div class="modal-buttons">
            <button
              class="save"
              onClick={() => {
                for (const bookmark of children) {
                  openUrlBackground(bookmark.url);
                }
                setShowChildrenModal(false);
              }}
            >
              Open
            </button>
            <button onClick={() => setShowChildrenModal(false)}>Cancel</button>
          </div>
        </Modal>
      </ContextMenuItem>
    </>
  );
};

const FolderTile: Component = () => {
  const folderItem = useContext(FolderSortableItemContext);

  const [children, setChildren] =
    createSignal<ReadonlyArray<Bookmarks.BookmarkTreeNode>>();
  const visuals = createMemo(() =>
    (children() ?? []).map((n) => bookmarkVisual(n.id))
  );
  const isLoading = createMemo(() =>
    visuals()
      .map((vis) => vis[0]())
      .some((vis) => vis === "loading")
  );
  const isLoaded = createMemo(() => {
    const cs = children();
    return (
      cs != null &&
      (cs.length == 0 ||
        visuals()
          .map((vis) => vis[0]())
          .every((vis) => vis !== "loading" && vis != null))
    );
  });
  bookmarks
    .getChildren(folderItem.item.id)
    .then((children) => setChildren(children.slice(0, 4)));

  const [onContext, setOnContext] = createSignal<MouseEvent>();

  const [settings] = useContext(SettingsContext);

  return (
    <TileCard
      backgroundColor="rgba(var(--background-rgb), 0.5)"
      onContextMenu={setOnContext}
    >
      <ContextMenu event={onContext()}>
        <FolderTileContextMenu />
      </ContextMenu>
      <Show when={isLoaded()} fallback={isLoading() ? <CircleLoader /> : null}>
        <Switch>
          <Match when={visuals().length == 0}>
            <img
              src={folderTileIcon}
              style={{ width: "100%", height: "100%" }}
              draggable={false}
            />
          </Match>
          <Match when={visuals()!.length > 0}>
            <div
              class="folder-content"
              style={{
                padding: `${Math.floor(settings.tileHeight / 9)}px ${Math.floor(
                  settings.tileWidth / 9
                )}px`,
                gap: `${Math.floor(settings.tileHeight / 9)}px ${Math.floor(
                  settings.tileWidth / 9
                )}px`,
              }}
            >
              <For each={visuals()}>
                {(nnVis) => {
                  const visLoad = nnVis[0]();
                  if (visLoad == null || visLoad === "loading") return null;

                  const width = createMemo(() =>
                    Math.floor(settings.tileWidth / 3)
                  );
                  const height = createMemo(() =>
                    Math.floor(settings.tileHeight / 3)
                  );

                  if (!isMemoBookmarkVisualMeta(visLoad)) {
                    if (visLoad === "folder") {
                      return (
                        <div
                          class="folder-content-item"
                          style={{
                            width: `${width()}px`,
                            height: `${height()}px`,
                          }}
                        >
                          <img
                            src={folderTileIcon}
                            style="height: 100%; width: 100%; object-fit: cover"
                            draggable={false}
                          />
                        </div>
                      );
                    }
                  } else {
                    const vis = visLoad.visual;
                    if (vis.kind === "image") {
                      return (
                        <div
                          class="folder-content-item"
                          style={{
                            width: `${width()}px`,
                            height: `${height()}px`,
                          }}
                        >
                          <img
                            src={getObjectUrl(vis.image.blob)}
                            style="height: 100%; width: 100%; object-fit: cover"
                            draggable={false}
                          />
                        </div>
                      );
                    } else {
                      return (
                        <div
                          class="folder-content-item"
                          style={{
                            width: `${width()}px`,
                            height: `${height()}px`,
                            "background-color": defaultTileBackgroundColor(
                              vis.hue,
                              settings.lightMode
                            ),
                          }}
                        />
                      );
                    }
                  }
                }}
              </For>
            </div>
          </Match>
        </Switch>
      </Show>
    </TileCard>
  );
};

export default FolderTile;
