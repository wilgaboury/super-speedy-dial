import {
  Component,
  For,
  createEffect,
  createMemo,
  createReaction,
  createSignal,
} from "solid-js";
import { Modal } from "./Modal";
import { Bookmarks } from "webextension-polyfill";
import fuzzysort from "fuzzysort";
import { BiRegularX } from "solid-icons/bi";
import { openTile } from "./Tile";
import { useNavigate } from "@solidjs/router";
import { getSubTreeAsList, isBookmark, rootFolderId } from "./utils/bookmark";
import { retrieveFaviconBlobSmall } from "./utils/image";
import { memo, mod } from "./utils/assorted";
import folderTileIcon from "./assets/folder.svg";
import webTileIcon from "./assets/web.svg";
import { dbGet, dbSet, faviconStore } from "./utils/database";

interface BlobOrEmpty {
  readonly blob: Blob | null;
}

export async function retrieveAndSaveFavicon(
  domain: string
): Promise<Blob | null> {
  const blobOrEmpty = await dbGet<BlobOrEmpty>(faviconStore, domain);
  if (blobOrEmpty == null) {
    const blob = await retrieveFaviconBlobSmall(domain);
    dbSet(faviconStore, domain, { blob });
    return blob;
  } else {
    return blobOrEmpty.blob;
  }
}

const retrieveFavicon = memo(async (domain: string) =>
  retrieveAndSaveFavicon(domain).then((blob) =>
    blob == null ? null : URL.createObjectURL(blob)
  )
);

interface SearchProps {
  readonly show: boolean;
  readonly onClose: () => void;
}

const maxResults = 20;

const Search: Component<SearchProps> = (props) => {
  const [nodes, setNodes] = createSignal<
    (Bookmarks.BookmarkTreeNode & { favicon?: string })[]
  >([]);
  const [text, setText] = createSignal("");
  const [selected, setSelected] = createSignal(0);

  const results = createMemo(() =>
    fuzzysort.go(text(), nodes(), { key: "title" })
  );

  const navigate = useNavigate();

  let inputRef: HTMLInputElement | undefined;
  createEffect(async () => {
    if (props.show) {
      const input = inputRef!;
      input.focus();
    }
  });

  const trackOpen = createReaction(async () => {
    if (!props.show) return trackOpen(() => props.show);

    const bookmarks = (await getSubTreeAsList(rootFolderId))
      .filter((b) => b.type != "separator")
      .map((b) => ({
        ...b,
        favicon: isBookmark(b) ? webTileIcon : folderTileIcon,
      }));

    setNodes(bookmarks);

    const loadedFavicons = await Promise.all(
      bookmarks.map(async (b) => {
        if (isBookmark(b)) {
          const favicon = await retrieveFavicon(b.url!);
          if (favicon != null) return { ...b, favicon };
        }
        return b;
      })
    );

    setNodes(loadedFavicons);
  });
  trackOpen(() => props.show);

  document.addEventListener("keydown", (e) => {
    if (props.show) {
      if (e.key == "Escape") props.onClose();
      else if (e.key == "ArrowUp") moveUp();
      else if (e.key == "ArrowDown") moveDown();
      else if (e.key == "Tab") {
        e.preventDefault();
        if (e.shiftKey) moveUp();
        else moveDown();
      } else if (e.key == "Enter") {
        const node = results()[selected()].obj;
        openTile(navigate, node, e.ctrlKey);
        props.onClose();
      }
    }
  });

  function moveUp() {
    setSelected((i) => mod(i - 1, Math.min(results().length, maxResults)));
  }

  function moveDown() {
    setSelected((i) => mod(i + 1, Math.min(results().length, maxResults)));
  }

  return (
    <Modal show={props.show} onBackgroundClick={() => props.onClose()}>
      <div
        class="search-container"
        style={{
          width: "500px",
          display: "flex",
          "flex-direction": "column",
          "justify-content": "stretch",
          padding: "5px",
        }}
        onmousedown={(e) => e.stopImmediatePropagation()}
      >
        <div
          style={{
            display: "flex",
            gap: "5px",
            "margin-bottom": results().length > 0 ? "5px" : "",
          }}
        >
          <input
            ref={inputRef}
            placeholder=" search"
            type="text"
            value={text()}
            onInput={(e) => {
              setSelected(0);
              setText(e.target.value);
            }}
            style={{ "flex-grow": "1" }}
          />
          <div class="button borderless" onClick={() => props.onClose()}>
            <BiRegularX size={20} />
          </div>
        </div>

        <For each={results().slice(0, maxResults)}>
          {(result, idx) => (
            <div
              class={`search-item ${selected() == idx() ? "selected" : ""}`}
              onmousedown={() => setSelected(idx())}
              onclick={(e) => {
                openTile(navigate, result.obj, e.ctrlKey);
                props.onClose();
              }}
            >
              <img src={result.obj.favicon} height={16} width={16} />
              <div class="search-item-text">
                {fuzzysort.highlight(result, (m) => (
                  <b>{m}</b>
                ))}
              </div>
            </div>
          )}
        </For>
      </div>
    </Modal>
  );
};

export default Search;
