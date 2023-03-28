import { useNavigate } from "@solidjs/router";
import { Component, createSignal, Match, Show, Switch } from "solid-js";
import { Bookmarks } from "webextension-polyfill";
import Loading from "./Loading";
import { getBookmarkImage, Sized } from "./utils";

interface TileProps {
  readonly node: Bookmarks.BookmarkTreeNode;
}

interface SizedUrl extends Sized {
  readonly url: string;
}

const BookmarkTile: Component<TileProps> = (props) => {
  const [image, setImage] = createSignal<SizedUrl>();
  const [showLoader, setShowLoadaer] = createSignal(false);

  getBookmarkImage(props.node, () => setShowLoadaer(true)).then((blob) => {
    setImage({
      url: URL.createObjectURL(blob.blob),
      ...blob,
    });
  });

  return (
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
  );
};

const FolderTile: Component<TileProps> = (props) => {
  return <></>;
};

const SeparatorTile: Component<TileProps> = (props) => {
  return <></>;
};

const Tile: Component<TileProps> = (props) => {
  const [image, setImage] = createSignal<SizedUrl>();
  const [showLoader, setShowLoadaer] = createSignal(false);

  getBookmarkImage(props.node, () => setShowLoadaer(true)).then((blob) => {
    setImage({
      url: URL.createObjectURL(blob.blob),
      ...blob,
    });
  });

  const [selected, setSelected] = createSignal(false);
  let didMouseMove = true;

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
        onmousedown={() => {
          setSelected(true);
          didMouseMove = false;
        }}
        onmouseup={(event) => {
          if (selected() && !didMouseMove) {
            onClick(props.node, event);
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
              props.node.type == "folder"
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
