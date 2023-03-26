import { Component, createSignal, Show } from "solid-js";
import { Bookmarks } from "webextension-polyfill";
import Loading from "./Loading";
import { getBookmarkImage, Sized } from "./utils";

interface TileProps {
  readonly node: Bookmarks.BookmarkTreeNode;
  readonly onClick?: (
    node: Bookmarks.BookmarkTreeNode,
    event: MouseEvent
  ) => void;
}

interface SizedUrl extends Sized {
  readonly url: string;
}

const Tile: Component<TileProps> = (props) => {
  const [image, setImage] = createSignal<SizedUrl>();
  const [showLoader, setShowLoadaer] = createSignal(false);

  getBookmarkImage(props.node, () => {
    console.log("callback show loader");
    setShowLoadaer(true);
  }).then((blob) => {
    setImage({
      url: URL.createObjectURL(blob.blob),
      ...blob,
    });
  });

  const [selected, setSelected] = createSignal(false);
  let didMouseMove = true;

  return (
    <div class="item-content">
      <div
        class="bookmark-container"
        onmousedown={() => {
          setSelected(true);
          didMouseMove = false;
        }}
        onmouseup={(event) => {
          if (
            props.onClick != null &&
            selected() &&
            !didMouseMove &&
            props.node.type != "separator"
          ) {
            props.onClick(props.node, event);
          }
          setSelected(false);
        }}
        onmousemove={() => {
          didMouseMove = true;
        }}
      >
        <div
          class="bookmark-card"
          style={`
          position: relative;
          background-color: ${
            props.node.type == "folder" ? "rgba(0, 0, 0, 0.5);" : "whitesmoke;"
          }
          ${selected() ? "border: 2px solid #0390fc;" : ""}
      `}
        >
          <Show when={image()} fallback={showLoader() ? <Loading /> : null}>
            {image()!.height <= 125 || image()!.width <= 200 ? (
              <img
                class="website-image"
                src={image()!.url}
                height={image()!.height}
                width={image()!.width}
              ></img>
            ) : (
              <img
                src={image()!.url}
                style={{
                  height: "100%",
                  width: "100%",
                  "object-fit": "cover",
                }}
              ></img>
            )}
          </Show>
        </div>
        <div class={`bookmark-title${selected() ? " selected" : ""}`}>
          {props.node.type == "separator" ? "Separator" : props.node.title}
        </div>
      </div>
    </div>
  );
};

export default Tile;
