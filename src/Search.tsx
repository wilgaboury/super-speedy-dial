import {
  Component,
  For,
  Show,
  createEffect,
  createMemo,
  createReaction,
  createSignal,
  onCleanup,
} from "solid-js";
import { Modal } from "./Modal";
import { Bookmarks } from "webextension-polyfill";
import fuzzysort from "fuzzysort";
import { BiRegularRefresh, BiRegularX } from "solid-icons/bi";
import { openTile } from "./Tile";
import { useNavigate } from "@solidjs/router";
import {
  getSubTreeAsList,
  isBookmark,
  isFolder,
  isSeparator,
  rootFolderId,
} from "./utils/bookmark";
import { retrieveFaviconBlobSmall } from "./utils/image";
import { memo, mod, urlToDomain } from "./utils/assorted";
import folderTileIcon from "./assets/folder.svg";
import webTileIcon from "./assets/web.svg";
import { dbGet, dbSet, faviconStore, getDb } from "./utils/database";

interface BlobOrEmpty {
  readonly blob: Blob | null;
}

function isBlobOrEmpty(obj: any): obj is BlobOrEmpty {
  return obj != null && (obj.blob === null || obj.blob instanceof Blob);
}

export async function retrieveAndSaveFavicon(
  domain: string
): Promise<Blob | null> {
  const blobOrEmpty = await dbGet(faviconStore, domain);
  if (!isBlobOrEmpty(blobOrEmpty)) {
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

const buttonIconSize = 20;
const maxResults = 20;

const Search: Component<SearchProps> = (props) => {
  const [nodes, setNodes] = createSignal<
    (Bookmarks.BookmarkTreeNode & { favicon?: string; domain: string })[]
  >([]);
  const [text, setText] = createSignal("");
  const [selected, setSelected] = createSignal(0);

  const results = createMemo(() =>
    fuzzysort.go(text(), nodes(), {
      keys: ["title", "domain"],
      limit: maxResults,
    })
  );

  const navigate = useNavigate();

  let inputRef: HTMLInputElement | undefined;
  createEffect(async () => {
    if (props.show) {
      const input = inputRef!;
      input.focus();
    }
  });

  async function loadNodes() {
    const bookmarks = (await getSubTreeAsList(rootFolderId))
      .filter((b) => !isSeparator(b))
      .map((b) => ({
        ...b,
        favicon: isBookmark(b) ? webTileIcon : folderTileIcon,
        domain: b.url == null ? "" : urlToDomain(b.url),
      }));

    setNodes(bookmarks);
  }

  async function loadFavicons(refresh: boolean = false) {
    if (refresh) retrieveFavicon.cache.clear();
    const loadedFavicons = await Promise.all(
      nodes().map(async (b) => {
        if (isBookmark(b)) {
          const favicon = await retrieveFavicon(b.url!);
          if (favicon != null) return { ...b, favicon };
        }
        return b;
      })
    );
    setNodes(loadedFavicons);
  }

  const trackOpen = createReaction(async () => {
    if (!props.show) return trackOpen(() => props.show);
    await loadNodes();
    await loadFavicons();
  });
  trackOpen(() => props.show);

  const keydownListener = (e: KeyboardEvent) => {
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
        openTile(navigate, node, e);
        if (isFolder(node)) props.onClose();
      }
    }
  };
  createEffect(() => {
    if (props.show) {
      setTimeout(() => {
        window.addEventListener("keydown", keydownListener);
      });
    }
    onCleanup(() => {
      window.removeEventListener("keydown", keydownListener);
    });
  });

  function moveUp() {
    setSelected((i) => mod(i - 1, Math.min(results().length, maxResults)));
  }

  function moveDown() {
    setSelected((i) => mod(i + 1, Math.min(results().length, maxResults)));
  }

  const [refreshEnabled, setRefreshEnabled] = createSignal(true);

  return (
    <Modal show={props.show} onClose={props.onClose} closeOnBackgruondClick>
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
          <form
            class="input-text"
            style={{
              display: "flex",
              "flex-grow": "1",
              "align-items": "center",
              gap: "5px",
            }}
            onKeyDown={(e) => {
              if (e.key == "Enter") {
                e.preventDefault();
                return false;
              }
            }}
          >
            <input
              ref={inputRef}
              class="blank"
              placeholder=" search"
              type="text"
              value={text()}
              onInput={(e) => {
                setSelected(0);
                setText(e.target.value);
              }}
              style={{ "flex-grow": "1", color: "var(--text-color)" }}
            />
            <Show when={text().length > 0}>
              <button
                class="borderless"
                onClick={() => {
                  setText("");
                  inputRef?.focus();
                }}
                style={{ "font-size": "12px", padding: "2px", color: "gray" }}
              >
                Clear
              </button>
            </Show>
          </form>
          <button
            class={`borderless ${refreshEnabled() ? "" : "disabled"}`}
            onClick={async () => {
              if (refreshEnabled()) {
                setRefreshEnabled(false);
                await (await getDb()).clear(faviconStore);
                await loadFavicons(true);
                setRefreshEnabled(true);
              }
            }}
          >
            <BiRegularRefresh size={buttonIconSize} />
          </button>
          <button class="borderless" onClick={() => props.onClose()}>
            <BiRegularX size={buttonIconSize} />
          </button>
        </div>

        <For each={results()}>
          {(result, idx) => (
            <div
              class={`search-item ${selected() == idx() ? "selected" : ""}`}
              onmousedown={() => setSelected(idx())}
              onclick={(e) => {
                openTile(navigate, result.obj, e);
                if (isFolder(result.obj)) props.onClose();
              }}
            >
              <img src={result.obj.favicon} height={16} width={16} />
              <div class="search-item-text">
                {fuzzysort.highlight(result[0], (m) => <b>{m}</b>) ??
                  result.obj.title}
              </div>
            </div>
          )}
        </For>
      </div>
    </Modal>
  );
};

export default Search;
