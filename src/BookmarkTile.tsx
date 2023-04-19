import {
  BiRegularCamera,
  BiRegularEdit,
  BiRegularImageAlt,
  BiRegularLinkExternal,
  BiRegularTrash,
  BiRegularWindowOpen,
} from "solid-icons/bi";
import {
  Component,
  Show,
  createResource,
  createSignal,
  useContext,
} from "solid-js";
import { Bookmarks, bookmarks, permissions } from "webextension-polyfill";
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
import { openUrl, openUrlNewTab } from "./utils/assorted";
import {
  Image,
  retrievePageScreenshotImage,
  retrieveTileImage,
} from "./utils/image";
import { TileCard } from "./Tile";

interface BookmarkTileContextMenuProps {
  readonly node: Bookmarks.BookmarkTreeNode;
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
              <div>Url</div>
              <input
                type="text"
                class="default"
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
              Confirm you would like to delete the bookmark "{props.node.title}"
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
      </Show>
      <ContextMenuItem
        icon={<BiRegularLinkExternal size={ctxMenuIconSize} />}
        onClick={() => openUrl(props.node.url)}
      >
        Open
      </ContextMenuItem>
      <ContextMenuItem
        icon={<BiRegularWindowOpen size={ctxMenuIconSize} />}
        onClick={() => openUrlNewTab(props.node.url)}
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
        onClick={async () => {
          if (await permissions.request({ origins: ["<all_urls>"] })) {
            props.onCaptureScreenshot();
          }
        }}
      >
        Use Screenshot
      </ContextMenuItem>
    </>
  );
};

interface BookmarkTileProps {
  readonly node: Bookmarks.BookmarkTreeNode;
  readonly title: string;
  readonly onRetitle: (title: string) => void;
}

const BookmarkTile: Component<BookmarkTileProps> = (props) => {
  const [image, { mutate: setImage }] = createResource<Image>(() =>
    retrieveTileImage(props.node, () => setShowLoader(true))
  );
  const [showLoader, setShowLoader] = createSignal(false);

  setTimeout(() => setShowLoader(true), 250);

  const [onContext, setOnContext] = createSignal<MouseEvent>();

  return (
    <TileCard
      backgroundColor={"var(--button-hover)"}
      onContextMenu={setOnContext}
    >
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
            retrievePageScreenshotImage(props.node.id, props.node.url).then(
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

export default BookmarkTile;
