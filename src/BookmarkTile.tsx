import { Component, createSignal, Show } from "solid-js";
import browser from "webextension-polyfill";
import Loading from "./Loading";
import { getBookmarkImage, Sized } from "./utils";

interface BookmarkTileProps {
  readonly node: browser.Bookmarks.BookmarkTreeNode;
}

interface SizedUrl extends Sized {
  readonly url: string;
}

const BookmarkTile: Component<BookmarkTileProps> = (props) => {
  const [image, setImage] = createSignal<SizedUrl>();
  const [showLoader, setShowLodaer] = createSignal(false);

  getBookmarkImage(props.node, () => setShowLodaer(true)).then((blob) => {
    // console.log("got image");
    setImage({
      url: URL.createObjectURL(blob.blob),
      ...blob,
    });
  });

  return (
    <div class="item-content">
      <div class="bookmark-container">
        <div
          class="bookmark-card"
          style={{
            position: "relative",
            "background-color":
              props.node != null && props.node.type == "folder"
                ? "rgba(0,0,0,0.5)"
                : "whitesmoke",
          }}
        >
          <Show when={image()} fallback={showLoader() && <Loading />}>
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
      </div>
    </div>
  );
};

export default BookmarkTile;
