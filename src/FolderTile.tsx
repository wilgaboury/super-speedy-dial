import { useNavigate } from "@solidjs/router";
import {
  BiRegularEdit,
  BiRegularFolderOpen,
  BiRegularLinkExternal,
  BiRegularTrash,
  BiRegularWindowOpen,
} from "solid-icons/bi";
import {
  Component,
  For,
  Match,
  Show,
  Switch,
  createEffect,
  createMemo,
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
import { SettingsContext } from "./settings";
import { openFolder, openFolderNewTab, openUrlNewTab } from "./utils/assorted";
import { getSubTreeAsList, isBookmark } from "./utils/bookmark";
import { Image, TileVisual, retrieveTileImage } from "./utils/image";
import { TileCard } from "./Tile";

interface FolderTileContextMenuProps {
  readonly node: Bookmarks.BookmarkTreeNode;
  readonly title: string;
  readonly onRetitle: (name: string) => void;
}

const FolderTileContextMenu: Component<FolderTileContextMenuProps> = (
  props
) => {
  const [showEditModal, setShowEditModal] = createSignal(false);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);
  const [showChildrenModal, setShowChildrenModal] = createSignal(false);
  const [title, setTitle] = createSignal(props.title);

  const folderState = useContext(FolderStateContext);

  let children: ReadonlyArray<Bookmarks.BookmarkTreeNode> = [];
  let deleteHeld = false;

  function editOnKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") editSave();
  }

  function editSave() {
    folderState.editChild(gridItem.idx(), {
      ...props.node,
      title: title(),
    });
    setShowEditModal(false);
  }

  const gridItem = useContext(GridItemContext);
  const navigator = useNavigate();

  let editNameRef: HTMLInputElement | undefined;

  return (
    <>
      <Show when={props.node.unmodifiable == null}>
        <ContextMenuItem
          icon={<BiRegularEdit size={ctxMenuIconSize} />}
          onClick={() => {
            setShowEditModal(true);
            editNameRef?.focus();
          }}
        >
          Edit
          <Modal show={showEditModal()}>
            <div class="modal-content" style={{ width: "325px" }}>
              <div>Name</div>
              <input
                ref={editNameRef}
                type="text"
                class="default"
                value={props.title}
                onInput={(e) => setTitle(e.target.value)}
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
          onClick={async () => {
            children = (await getSubTreeAsList(props.node.id)).filter(
              isBookmark
            );
            setShowDeleteModal(true);
          }}
        >
          Delete
          <Modal show={showDeleteModal()}>
            <div class="modal-content" style={{ "max-width": "550px" }}>
              Confirm you would like to delete the folder "{props.node.title}"
              {children.length > 0
                ? ` and the ${children.length} bookmark${
                    children.length > 1 ? "s" : ""
                  } inside (press and hold)`
                : ""}
            </div>
            <div class="modal-separator" />
            <div class="modal-buttons">
              <div
                class={`button delete ${children.length > 0 ? "hold" : ""}`}
                onClick={() => {
                  if (children.length == 0 || deleteHeld) {
                    setShowDeleteModal(false);
                    gridItem.onDelete();
                    bookmarks.removeTree(props.node.id);
                  }
                }}
                onAnimationStart={() => (deleteHeld = false)}
                onAnimationEnd={() => (deleteHeld = true)}
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
      </Show>
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
          children = (await getSubTreeAsList(props.node.id)).filter(
            (n) => n.url != null
          );
          if (children.length < 8) {
            for (const bookmark of children) {
              openUrlNewTab(bookmark.url, false);
            }
          } else {
            setShowChildrenModal(true);
          }
        }}
      >
        Open Children
        <Modal show={showChildrenModal()}>
          <div class="modal-content">
            Confirm you would like to open {children.length} tabs
          </div>
          <div class="modal-separator" />
          <div class="modal-buttons">
            <div
              class="button save"
              onClick={() => {
                for (const bookmark of children) {
                  openUrlNewTab(bookmark.url, false);
                }
                setShowChildrenModal(false);
              }}
            >
              Open
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

interface FolderTileProps {
  readonly node: Bookmarks.BookmarkTreeNode;
  readonly title: string;
  readonly onRetitle: (title: string) => void;
}

const FolderTile: Component<FolderTileProps> = (props) => {
  const [showLoader, setShowLoadaer] = createSignal(false);
  const [images] = createResource<ReadonlyArray<TileVisual>>(() =>
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

  const [settings] = useContext(SettingsContext);

  return (
    <TileCard
      backgroundColor="rgba(var(--background-rgb), 0.5)"
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
            <img
              src={folderTileIcon}
              style={{ width: "100%", height: "100%" }}
              draggable={false}
            />
          </Match>
          <Match when={images()!.length > 0}>
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
              <For each={images()}>
                {(nnVisaul) => {
                  const width = createMemo(() =>
                    Math.floor(settings.tileWidth / 3)
                  );
                  const height = createMemo(() =>
                    Math.floor(settings.tileHeight / 3)
                  );

                  if (nnVisaul.type === "image") {
                    return (
                      <div
                        class="folder-content-item"
                        style={{
                          width: `${width()}px`,
                          height: `${height()}px`,
                        }}
                      >
                        <img
                          src={nnVisaul.image.url}
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
                          "background-color": nnVisaul.text.color,
                        }}
                      />
                    );
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
