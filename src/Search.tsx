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
import { getObjectUrl, mod, run, urlToDomain } from "./utils/assorted";
import folderTileIcon from "./assets/folder.svg";
import webTileIcon from "./assets/web.svg";
import { dbGet, dbSet, faviconStore } from "./utils/database";
import { Bookmarks } from "webextension-polyfill";

interface MaybeBlob {
  readonly blob?: Blob;
}

function isMabyeBlob(obj: any): obj is MaybeBlob {
  return obj != null && (obj.blob === undefined || obj.blob instanceof Blob);
}

async function retrieveAndStoreFavicon(
  domain: string,
  checkStorage: boolean = true
): Promise<Blob | undefined> {
  if (checkStorage) {
    const maybeBlob = await dbGet(faviconStore, domain);
    if (isMabyeBlob(maybeBlob)) return maybeBlob.blob;
  }
  const maybeBlob = await retrieveFaviconBlobSmall(domain);
  const blob = maybeBlob != null ? maybeBlob : undefined;
  dbSet(faviconStore, domain, { blob });
  return blob;
}

interface SearchProps {
  readonly show: boolean;
  readonly onClose: () => void;
}

const buttonIconSize = 20;
const maxResults = 20;

const Search: Component<SearchProps> = (props) => {
  const [nodes, setNodes] = createSignal<
    ReadonlyArray<Bookmarks.BookmarkTreeNode>
  >([]);
  const [text, setText] = createSignal("");
  const [selected, setSelected] = createSignal(0);

  const [favicons, setFavicons] = createSignal<Map<string, Blob>>(new Map());
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
    const ns = (await getSubTreeAsList(rootFolderId)).filter(
      (n) => !isSeparator(n)
    );
    setNodes(ns);
  }

  async function loadFavicons(
    nodes: ReadonlyArray<Bookmarks.BookmarkTreeNode>,
    checkStorage: boolean = true
  ) {
    const items = await Promise.allSettled(
      nodes
        .filter(isBookmark)
        .map(async (node): Promise<[string, Blob | undefined]> => {
          const domain = urlToDomain(node.url!)!;
          return [domain, await retrieveAndStoreFavicon(domain, checkStorage)];
        })
    );
    setFavicons(
      items.reduce((map, node) => {
        if (node.status === "fulfilled" && node.value[1] != null) {
          map.set(node.value[0], node.value[1]);
        }
        return map;
      }, new Map<string, Blob>())
    );
  }

  const trackOpen = createReaction(async () => {
    if (!props.show) return trackOpen(() => props.show);
    await loadNodes();
    await loadFavicons(nodes());
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
                await loadFavicons(nodes(), false);
                setRefreshEnabled(true);
              }
            }}
          >
            <BiRegularRefresh
              size={buttonIconSize}
              class={`${refreshEnabled() ? "" : "favicon-button-loading"}`}
            />
          </button>
          <button class="borderless" onClick={() => props.onClose()}>
            <BiRegularX size={buttonIconSize} />
          </button>
        </div>

        <For each={results().map((res) => res.obj)}>
          {(node, idx) => (
            <div
              class={`search-item ${selected() == idx() ? "selected" : ""}`}
              onmousedown={() => setSelected(idx())}
              onclick={(e) => {
                openTile(navigate, node, e);
                if (isFolder(node)) props.onClose();
              }}
            >
              <img
                src={run(() => {
                  if (isFolder(node)) return folderTileIcon;
                  const favBlob = favicons().get(urlToDomain(node.url!)!);
                  if (favBlob != null) return getObjectUrl(favBlob);
                  return webTileIcon;
                })}
                height={16}
                width={16}
              />
              <div class="search-item-text">
                {fuzzysort.highlight(results()[idx()][0], (m) => <b>{m}</b>) ??
                  node.title}
              </div>
            </div>
          )}
        </For>
      </div>
    </Modal>
  );
};

export default Search;
