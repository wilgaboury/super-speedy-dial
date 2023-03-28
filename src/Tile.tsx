import { useNavigate, Navigator } from "@solidjs/router";
import { Component, createSignal, For, Match, Show, Switch } from "solid-js";
import browser, { Bookmarks } from "webextension-polyfill";
import Loading from "./Loading";
import { addUrlToBlob, retrieveTileImage, SizedUrl } from "./utils";
import emptyFolderTileIcon from "./assets/folder_empty.png";
import seperatorTileIcon from "./assets/separator.png";
import { ContextMenuItem, contextMenuState } from "./ContextMenu";

function open(
  navigate: Navigator,
  node: Bookmarks.BookmarkTreeNode,
  event: MouseEvent
) {
  if (node.type === "separator") {
    return;
  } else if (node.type === "folder") {
    navigate(`/folder/${node.id}`);
  } else if (node.type === "bookmark") {
    if (event.ctrlKey) {
      const win = window.open(node.url, "_blank");
      win?.focus();
    } else if (node.url != null) {
      window.location.href = node.url;
    }
  }
}

interface TileProps {
  readonly node: Bookmarks.BookmarkTreeNode;
}

const BookmarkTile: Component<TileProps> = (props) => {
  const [image, setImage] = createSignal<SizedUrl>();
  const [showLoader, setShowLoadaer] = createSignal(false);

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
            lastX = e.pageX;
            lastY = e.pageY;
          }
        }}
        onmouseup={(e) => {
          if (e.button == 0 && selected() && mouseDist < 5) {
            open(navigate, props.node, e);
          }
          setSelected(false);
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
          class="bookmark-card"
          style={`
            position: relative;
            background-color: ${
              props.node.type !== "bookmark"
                ? "rgba(0, 0, 0, 0.5);"
                : "whitesmoke;"
            }
            ${selected() ? "border: 2px solid #0390fc;" : ""}
          `}
          onContextMenu={(e) => {
            contextMenuState.open(
              e,
              <>
                <ContextMenuItem>Edit</ContextMenuItem>
                <ContextMenuItem>Delete</ContextMenuItem>
                <ContextMenuItem>Open</ContextMenuItem>
                <ContextMenuItem>Open In New Tab</ContextMenuItem>
              </>
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
