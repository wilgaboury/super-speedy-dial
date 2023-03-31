import { useNavigate, Navigator } from "@solidjs/router";
import { Component, createSignal, For, Match, Show, Switch } from "solid-js";
import browser, { Bookmarks } from "webextension-polyfill";
import Loading from "./Loading";
import { addUrlToBlob, retrieveTileImage, SizedUrl } from "./utils";
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
import {
  ModalButtons,
  ModalContent,
  ModalSeparator,
  modalState,
} from "./Modal";

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

function open(
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

interface TileProps {
  readonly node: Bookmarks.BookmarkTreeNode;
}

const BookmarkTileContextMenu: Component<TileProps> = (props) => {
  return (
    <>
      <ContextMenuItem
        icon={<BiRegularEdit size={ctxMenuIconSize} />}
        onClick={() =>
          modalState.open(
            <>
              <ModalContent>TEST TEST TEST TEST TEST TEST</ModalContent>
              <ModalSeparator />
              <ModalButtons>
                <div class="button save">Save</div>
                <div class="button" onClick={() => modalState.close()}>
                  Cancel
                </div>
              </ModalButtons>
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
              <ModalContent>
                Confirm you would like to delete {props.node.title}
              </ModalContent>
              <ModalSeparator />
              <ModalButtons>
                <div class="button delete">Delete</div>
                <div class="button" onClick={() => modalState.close()}>
                  Cancel
                </div>
              </ModalButtons>
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
      <ContextMenuItem icon={<BiRegularImageAlt size={ctxMenuIconSize} />}>
        Reload Image
      </ContextMenuItem>
      <ContextMenuItem icon={<BiRegularCamera size={ctxMenuIconSize} />}>
        Use Screenshot
      </ContextMenuItem>
    </>
  );
};

const BookmarkTile: Component<TileProps> = (props) => {
  const [image, setImage] = createSignal<SizedUrl>();
  const [showLoader, setShowLoadaer] = createSignal(false);

  setTimeout(() => setShowLoadaer(true), 250);

  retrieveTileImage(props.node, () => setShowLoadaer(true)).then((blob) => {
    setImage(addUrlToBlob(blob));
  });

  return (
    <>
      <Show when={image() != null} fallback={showLoader() ? <Loading /> : null}>
        {image()!.height <= 125 || image()!.width <= 200 ? (
          <img
            class="website-image"
            src={image()!.url}
            height={image()!.height}
            width={image()!.width}
          />
        ) : (
          <img
            src={image()!.url}
            style={{
              height: "100%",
              width: "100%",
              "object-fit": "cover",
            }}
          />
        )}
      </Show>
    </>
  );
};

const FolderTile: Component<TileProps> = (props) => {
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
    <>
      {" "}
      <Show
        when={images() != null}
        fallback={showLoader() ? <Loading /> : null}
      >
        <Switch>
          <Match when={images()!.length == 0}>
            <img src={emptyFolderTileIcon} height="150" />
          </Match>
          <Match when={images()!.length > 0}>
            <div class="folder-content">
              <For each={images()}>
                {(image) => (
                  <div class="folder-content-item">
                    <img
                      src={image.url}
                      style="height: 100%; width: 100%; object-fit: cover"
                    />
                  </div>
                )}
              </For>
            </div>
          </Match>
        </Switch>
      </Show>
    </>
  );
};

const SeparatorTile: Component<TileProps> = (props) => {
  return (
    <img
      src={seperatorTileIcon}
      style={{
        height: "100%",
        width: "100%",
        "object-fit": "cover",
      }}
    />
  );
};

const Tile: Component<TileProps> = (props) => {
  const [selected, setSelected] = createSignal(false);
  const navigate = useNavigate();

  let mouseDist = Infinity;
  let mouseDownTime = 0;
  let lastX = 0;
  let lastY = 0;

  return (
    <div class="item-content">
      <div
        class="bookmark-container"
        onmousedown={(e) => {
          if (e.button == 0) {
            setSelected(true);
            mouseDist = 0;
            mouseDownTime = Date.now();
            lastX = e.pageX;
            lastY = e.pageY;
          }

          const onMouseUp = (e: MouseEvent) => {
            if (
              e.button == 0 &&
              selected() &&
              (Date.now() - mouseDownTime < 100 || mouseDist < 8)
            ) {
              open(navigate, props.node, e);
            }
            setSelected(false);
            document.removeEventListener("mouseup", onMouseUp);
          };

          document.addEventListener("mouseup", onMouseUp);
        }}
        onmousemove={(e) => {
          mouseDist += Math.sqrt(
            Math.pow(lastX - e.pageX, 2) + Math.pow(lastY - e.pageY, 2)
          );
          lastX = e.pageX;
          lastY = e.pageY;
        }}
      >
        <div
          class={`bookmark-card ${selected() ? "selected" : ""}`}
          style={`
            position: relative;
            background-color: ${
              props.node.type !== "bookmark"
                ? "rgba(255, 255, 255, 0.5);"
                : "whitesmoke;"
            }
          `}
          onContextMenu={(e) => {
            contextMenuState.open(
              e,
              <Switch>
                <Match when={props.node.type === "bookmark"}>
                  <BookmarkTileContextMenu node={props.node} />
                </Match>
                <Match when={props.node.type === "folder"}>
                  <></>
                </Match>
                <Match when={props.node.type === "separator"}>
                  <></>
                </Match>
              </Switch>
            );
          }}
        >
          <Switch>
            <Match when={props.node.type === "bookmark"}>
              <BookmarkTile node={props.node} />
            </Match>
            <Match when={props.node.type === "folder"}>
              <FolderTile node={props.node} />
            </Match>
            <Match when={props.node.type === "separator"}>
              <SeparatorTile node={props.node} />
            </Match>
          </Switch>
        </div>
        <div class={`bookmark-title${selected() ? " selected" : ""}`}>
          {props.node.type == "separator" ? "Separator" : props.node.title}
        </div>
      </div>
    </div>
  );
};

export default Tile;
