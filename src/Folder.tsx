import { useNavigate, useParams } from "@solidjs/router";
import {
  Component,
  Show,
  createContext,
  createEffect,
  createResource,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import browser, { Bookmarks, bookmarks } from "webextension-polyfill";
import Header from "./Header";
import Tile, { openTile } from "./Tile";
import { rootFolderId } from "./utils/bookmark";
import {
  CancelablePromise,
  isChrome,
  isFirefox,
  makeSilentCancelable,
} from "./utils/assorted";
import {
  Sortable,
  createSortableItemContext,
  flowGridLayout,
} from "./Sortable";
import { SettingsContext } from "./settings";

interface FolderState {
  readonly setId: (id: string) => void;
  readonly move: (startIdx: number, endIdx: number) => void;
  readonly remove: (idx: number) => void;
  readonly merge: (nodes: Readonly<Bookmarks.BookmarkTreeNode[]>) => void;
  readonly createChild: (create: Bookmarks.CreateDetails) => void;
  readonly editChild: (idx: number, node: Bookmarks.BookmarkTreeNode) => void;
  readonly children: () => ReadonlyArray<Bookmarks.BookmarkTreeNode>;
}

export function FolderState(): FolderState {
  let parentId = rootFolderId;
  const [state, setState] = createStore<Bookmarks.BookmarkTreeNode[]>([]);
  return {
    setId: (id: string) => {
      parentId = id;
    },
    move: (startIdx: number, endIdx: number) => {
      setState((prev) => {
        const item = prev[startIdx];
        const result = [
          ...prev.slice(0, startIdx),
          ...prev.slice(startIdx + 1, prev.length),
        ];
        result.splice(endIdx, 0, item);
        return result;
      });
    },
    remove: (idx: number) => {
      setState((prev) => [
        ...prev.slice(0, idx),
        ...prev.slice(idx + 1, prev.length),
      ]);
    },
    merge: (nodes: Readonly<Bookmarks.BookmarkTreeNode[]>) => {
      if (parentId == rootFolderId) {
        for (const node of nodes) {
          node.unmodifiable = "managed";
        }
      }
      setState((prev) => [
        ...reconcile(nodes, { key: "id", merge: true })(prev),
      ]);
    },
    createChild: (create: Bookmarks.CreateDetails) => {
      browser.bookmarks
        .create({ ...create, index: 0, parentId })
        .then((n) => setState((bs) => [n, ...bs]));
    },
    editChild: (idx: number, node: Bookmarks.BookmarkTreeNode) => {
      setState([idx], reconcile(node));
      browser.bookmarks.update(node.id, {
        title: node.title,
        url: node.url,
      });
    },
    children: (): ReadonlyArray<Bookmarks.BookmarkTreeNode> => state,
  };
}

export const FolderStateContext = createContext(FolderState());

export const FolderSortableItemContext =
  createSortableItemContext<Bookmarks.BookmarkTreeNode>();

export const Folder: Component = () => {
  const params = useParams<{ id: string }>();

  const [node] = createResource(
    () => params.id,
    async (id) => (await browser.bookmarks.get(id))[0]
  );

  const [nodesLoaded, setNodesLoaded] = createSignal(false);
  const state = FolderState();

  let currentChildrenPromise:
    | CancelablePromise<Bookmarks.BookmarkTreeNode[] | null>
    | undefined;
  createEffect(async () => {
    if (currentChildrenPromise != null) currentChildrenPromise.cancel();
    currentChildrenPromise = makeSilentCancelable(
      bookmarks.getChildren(params.id)
    );
    const children = await currentChildrenPromise.promise;
    if (children == null) return;
    state.setId(params.id);
    state.merge(children);
    setNodesLoaded(true);
  });

  const focusListener = async () => {
    const children = await bookmarks.getChildren(params.id);
    state.merge(children);
  };
  window.addEventListener("focus", focusListener);
  onCleanup(() => window.removeEventListener("focus", focusListener));

  function isNotRoot() {
    return params.id != rootFolderId;
  }

  function persistBookmarkMove(
    node: Bookmarks.BookmarkTreeNode,
    startIdx: number,
    endIdx: number
  ) {
    if (isChrome && startIdx < endIdx) endIdx++;
    browser.bookmarks.move(node.id, {
      parentId: node.parentId,
      index: endIdx,
    });
  }

  const navigate = useNavigate();

  const [settings] = useContext(SettingsContext);

  const layout = flowGridLayout(() => {
    settings.tileWidth;
    settings.tileHeight;
    settings.tileGap;
    settings.tileFont;
  });

  return (
    <FolderStateContext.Provider value={state}>
      <Show when={node()}>{(nnNode) => <Header node={nnNode()} />}</Show>
      <div class="grid-container">
        <Sortable
          each={state.children()}
          layout={layout}
          onClick={(item, _idx, e) => openTile(navigate, item, e.ctrlKey)}
          onMove={(_node, startIdx, endIdx) => {
            if (isNotRoot()) {
              state.move(startIdx, endIdx);
            }
          }}
          onDragEnd={(node, startIdx, endIdx) => {
            if (isNotRoot()) {
              persistBookmarkMove(node, startIdx!, endIdx);
            }
          }}
          autoscroll={document.documentElement}
        >
          {(props) => (
            <FolderSortableItemContext.Provider value={props}>
              <Tile />
            </FolderSortableItemContext.Provider>
          )}
        </Sortable>
        <Show when={nodesLoaded() && state.children().length == 0}>
          <div
            class="header-item"
            style={{ "font-size": "18px", padding: "4px" }}
          >
            This Folder Is Empty
          </div>
        </Show>
      </div>
    </FolderStateContext.Provider>
  );
};
