import { useNavigate } from "@solidjs/router";
import { Component, createSignal, For, Match, Show, Switch } from "solid-js";
import browser, { Bookmarks } from "webextension-polyfill";
import Loading from "./Loading";
import { addUrlToBlob, retrieveTileImage, SizedBlob, SizedUrl } from "./utils";
import folderTileIcon from "./assets/folder.png";

interface TileProps {
  readonly node: Bookmarks.BookmarkTreeNode;
}

const TileButton: Component = () => {
  return (
    <div class="bookmark-cover">
      <div class="edit-bookmark-buttons-container">
        <div
          class="edit-bookmark-button plastic-button"
          onClick={(event) => event.stopPropagation()}
          onmousedown={(event) => event.stopPropagation()}
          onmouseup={(event) => event.stopPropagation()}
        >
          ...
        </div>
      </div>
    </div>
  );
};

const BookmarkTile: Component<TileProps> = (props) => {
  const [image, setImage] = createSignal<SizedUrl>();
  const [showLoader, setShowLoadaer] = createSignal(false);

  retrieveTileImage(props.node, () => setShowLoadaer(true)).then((blob) => {
    setImage(addUrlToBlob(blob));
  });

  return (
    <>
      <Show when={image()} fallback={showLoader() ? <Loading /> : null}>
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
      <TileButton />
    </>
  );
};

const FolderTile: Component<TileProps> = (props) => {
  const [images, setImages] = createSignal<ReadonlyArray<SizedUrl>>();
  browser.bookmarks.getChildren(props.node.id).then((children) => {
    Promise.all(children.slice(0, 4).map((n) => retrieveTileImage(n))).then(
      (blobs) => setImages(blobs.map(addUrlToBlob))
    );
  });

  return (
    <>
      {" "}
      <Show when={images() != null}>
        <Switch>
          <Match when={images()!.length == 0}>
            <img src={folderTileIcon} height="155" />
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
      <TileButton />
    </>
  );
};

const SeparatorTile: Component<TileProps> = (props) => {
  const [image, setImage] = createSignal<SizedUrl>();

  retrieveTileImage(props.node).then((blob) => {
    setImage(addUrlToBlob(blob));
  });

  return (
    <Show when={image()}>
      <img
        src={image()!.url}
        style={{
          height: "100%",
          width: "100%",
          "object-fit": "cover",
        }}
      />
    </Show>
  );
};

const Tile: Component<TileProps> = (props) => {
  const [selected, setSelected] = createSignal(false);
  let mouseDist = Infinity;
  let lastX = 0;
  let lastY = 0;

  const navigate = useNavigate();

  function onClick(node: Bookmarks.BookmarkTreeNode, event: MouseEvent) {
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

  return (
    <div class="item-content">
      <div
        class="bookmark-container"
        onmousedown={(e) => {
          if (e.buttons & 1) {
            setSelected(true);
            mouseDist = 0;
            lastX = e.pageX;
            lastY = e.pageY;
          }
        }}
        onmouseup={(event) => {
          if (selected() && mouseDist < 5) {
            onClick(props.node, event);
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
