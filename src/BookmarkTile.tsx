import {
  BiRegularCamera,
  BiRegularEdit,
  BiRegularImageAlt,
  BiRegularLinkExternal,
  BiRegularMinusBack,
  BiRegularTrash,
  BiRegularWindowOpen,
  BiRegularWindows,
  BiSolidWrench,
} from "solid-icons/bi";
import { Component, Show, createSignal, useContext } from "solid-js";
import { bookmarks } from "webextension-polyfill";
import {
  ContextMenu,
  ContextMenuItem,
  ContextMenuSeparator,
  ctxMenuIconSize,
} from "./ContextMenu";
import { FolderSortableItemContext, FolderStateContext } from "./Folder";
import CircleLoader from "./CircleLoader";
import { Modal } from "./Modal";
import {
  getObjectUrl,
  openUrl,
  openUrlBackground,
  openUrlNewTab,
  openUrlWindow,
  run,
} from "./utils/assorted";
import { retrievePageScreenshotImage } from "./utils/image";
import { TileCard } from "./Tile";
import { SettingsContext } from "./settings";
import {
  bookmarkVisual,
  isMemoBookmarkVisualMeta,
  memoRetrieveAutoBookmarkImage,
} from "./utils/visual";
import CustomizeTile from "./CustomizeTile";

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
  const [showCustomizeModal, setShowCustomizeModal] = createSignal(false);

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
        Open New Tab
      </ContextMenuItem>
      <ContextMenuItem
        icon={<BiRegularMinusBack size={ctxMenuIconSize} />}
        onClick={() => openUrlBackground(folderItem.item.url)}
      >
        Open Background
      </ContextMenuItem>
      <ContextMenuItem
        icon={<BiRegularWindows size={ctxMenuIconSize} />}
        onClick={() => openUrlWindow(folderItem.item.url)}
      >
        Open Window
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
      <ContextMenuItem
        icon={<BiSolidWrench size={ctxMenuIconSize} />}
        onClick={() => setShowCustomizeModal(true)}
      >
        Customize
        <CustomizeTile
          show={showCustomizeModal()}
          onClose={() => setShowCustomizeModal(false)}
        />
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

  const [visual, setVisual] = bookmarkVisual(folderItem.item.id);
  const [onContext, setOnContext] = createSignal<MouseEvent>();

  return (
    <TileCard
      backgroundColor={"var(--button-hover)"}
      onContextMenu={setOnContext}
    >
      <ContextMenu event={onContext()}>
        <BookmarkTileContextMenu
          onReloadImage={async () => {
            setVisual("loading");
            memoRetrieveAutoBookmarkImage.cache.delete(folderItem.item.url!);
            const image = await memoRetrieveAutoBookmarkImage(
              folderItem.item.url!
            );
            setVisual(undefined);
            if (image != null) {
              setVisual({
                visual: { kind: "image", image },
                customized: false,
              });
            }
          }}
          onCaptureScreenshot={() => {
            setVisual("loading");
            retrievePageScreenshotImage(folderItem.item.url).then((image) =>
              setVisual(
                image == null
                  ? undefined
                  : { visual: { kind: "image", image }, customized: false }
              )
            );
          }}
        />
      </ContextMenu>
      {run(() => {
        // for some reason <Show> does not work properly here
        const visLoad = visual();
        if (visLoad == null) return null;
        else if (visLoad === "loading") return <CircleLoader />;
        else if (!isMemoBookmarkVisualMeta(visLoad)) return;

        const vis = visLoad.visual;
        if (vis.kind === "image") {
          const image = vis.image;
          if (
            image.kind === "raster" &&
            (image.size.height <= 64 ||
              image.size.width <= 64 ||
              image.size.height / image.size.width < 0.5)
          ) {
            return (
              <img
                class="website-image"
                src={getObjectUrl(image.blob)}
                height={image.size.height}
                width={image.size.width}
                draggable={false}
              />
            );
          } else {
            return (
              <img
                src={getObjectUrl(image.blob)}
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
                  vis.hue,
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
                {vis.text.length > 0
                  ? vis.text
                  : (folderItem.item.url ?? "")
                      .substring(0, (folderItem.item.url ?? "").indexOf(":"))
                      .toUpperCase()}
              </span>
            </div>
          );
        }
      })}
    </TileCard>
  );
};

export default BookmarkTile;
