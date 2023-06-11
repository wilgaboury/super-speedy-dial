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
  createEffect,
  createResource,
  createSignal,
  useContext,
} from "solid-js";
import { bookmarks, permissions } from "webextension-polyfill";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ctxMenuIconSize,
} from "./ContextMenu";
import { FolderSortableItemContext, FolderStateContext } from "./Folder";
import Loading from "./Loading";
import { Modal } from "./Modal";
import { openUrl, openUrlNewTab } from "./utils/assorted";
import {
  TileVisual,
  retrievePageScreenshotImage,
  retrieveTileImage,
} from "./utils/image";
import { TileCard } from "./Tile";
import { SettingsContext } from "./settings";

interface BookmarkTileContextMenuProps {
  readonly onReloadImage: () => void;
  readonly onCaptureScreenshot: () => void;
}

const BookmarkTileContextMenu: Component<BookmarkTileContextMenuProps> = (
  props
) => {
  const folderState = useContext(FolderStateContext);
  const folderItem = useContext(FolderSortableItemContext);

  const [title, setTitle] = createSignal(folderItem.item.title);
  const [url, setUrl] = createSignal(folderItem.item.url ?? "");

  const [showEditModal, setShowEditModal] = createSignal(false);
  const [showDeleteModal, setShowDeleteModal] = createSignal(false);

  function editOnKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") editSave();
  }

  function editSave() {
    folderState.editChild(folderItem.idx(), {
      ...folderItem.item,
      title: title(),
      url: url(),
    });
    setShowEditModal(false);
  }

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
              <button class="save" onClick={editSave}>
                Save
              </button>
              <button onClick={() => setShowEditModal(false)}>Cancel</button>
            </div>
          </Modal>
        </ContextMenuItem>
        <ContextMenuItem
          icon={<BiRegularTrash size={ctxMenuIconSize} />}
          onClick={() => setShowDeleteModal(true)}
        >
          Delete
          <Modal
            show={showDeleteModal()}
            onClose={() => setShowDeleteModal(false)}
          >
            <div class="modal-content" style={{ "max-width": "550px" }}>
              Confirm you would like to delete the bookmark "
              {folderItem.item.title}"
            </div>
            <div class="modal-separator" />
            <div class="modal-buttons">
              <button
                class="delete"
                onClick={() => {
                  setShowDeleteModal(false);
                  folderState.remove(folderItem.idx());
                  bookmarks.remove(folderItem.item.id);
                }}
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
        onClick={() => openUrl(folderItem.item.url)}
      >
        Open
      </ContextMenuItem>
      <ContextMenuItem
        icon={<BiRegularWindowOpen size={ctxMenuIconSize} />}
        onClick={() => openUrlNewTab(folderItem.item.url)}
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

export function defaultTileBackgroundColor(hue: number, isLight: boolean) {
  return `hsl(${hue}, 100%, ${isLight ? "75%" : "25%"})`;
}

const BookmarkTile: Component = () => {
  const folderItem = useContext(FolderSortableItemContext);
  const [settings] = useContext(SettingsContext);

  const [visual, { mutate: setVisual }] = createResource<TileVisual>(() =>
    retrieveTileImage(folderItem.item, () => setShowLoader(true))
  );
  const [showLoader, setShowLoader] = createSignal(false);

  setTimeout(() => setShowLoader(true), 500);

  const [onContext, setOnContext] = createSignal<MouseEvent>();

  return (
    <TileCard
      backgroundColor={"var(--button-hover)"}
      onContextMenu={setOnContext}
    >
      <ContextMenu event={onContext()}>
        <BookmarkTileContextMenu
          onReloadImage={() => {
            setVisual(undefined);
            setShowLoader(true);
            retrieveTileImage(folderItem.item, () => {}, true).then(
              (visual) => {
                setVisual(visual);
              }
            );
          }}
          onCaptureScreenshot={() => {
            setVisual(undefined);
            setShowLoader(true);
            retrievePageScreenshotImage(
              folderItem.item.id,
              folderItem.item.url
            ).then((image) =>
              setVisual(image == null ? undefined : { type: "image", image })
            );
          }}
        />
      </ContextMenu>
      <Show when={visual()} fallback={showLoader() ? <Loading /> : null}>
        {(nnVisaulAccessor) => {
          const nnVisaul = nnVisaulAccessor();
          if (nnVisaul.type === "image") {
            const image = nnVisaul.image;
            if (
              image.type === "raster" &&
              (image.size.height <= 64 ||
                image.size.width <= 64 ||
                image.size.height / image.size.width < 0.5)
            ) {
              return (
                <img
                  class="website-image"
                  src={image.url}
                  height={image.size.height}
                  width={image.size.width}
                  draggable={false}
                />
              );
            } else {
              return (
                <img
                  src={image.url}
                  style={{
                    height: "100%",
                    width: "100%",
                    "object-fit": "cover",
                  }}
                  draggable={false}
                />
              );
            }
          } else {
            return (
              <div
                class="center-content"
                style={{
                  "background-color": defaultTileBackgroundColor(
                    nnVisaul.text.hue,
                    settings.lightMode
                  ),
                  padding: "10px",
                  "box-sizing": "border-box",
                }}
              >
                <span
                  style={{
                    "font-size": `${settings.tileHeight / 6}px`,
                    "max-width": "100%",
                    overflow: "hidden",
                    "white-space": "nowrap",
                    "text-overflow": "ellipsis",
                  }}
                >
                  {nnVisaul.text.text.length > 0
                    ? nnVisaul.text.text
                    : (folderItem.item.url ?? "")
                        .substring(0, (folderItem.item.url ?? "").indexOf(":"))
                        .toUpperCase()}
                </span>
              </div>
            );
          }
        }}
      </Show>
    </TileCard>
  );
};

export default BookmarkTile;
