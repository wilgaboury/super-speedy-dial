import { useNavigate, useParams } from "@solidjs/router";
import {
  Component,
  Show,
  createContext,
  createEffect,
  createResource,
  createSignal,
  useContext,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import browser, { Bookmarks, bookmarks } from "webextension-polyfill";
import Header from "./Header";
import Tile from "./Tile";
import { rootFolderId } from "./utils/bookmark";
import {
  CancelablePromise,
  createDebounced,
  makeSilentCancelable,
} from "./utils/assorted";
import {
  Sortable,
  createSortableItemContext,
  flowGridLayout,
} from "./sortable";
import { SettingsContext } from "./settings";

interface FolderState {
  readonly setId: (id: string) => void;
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
  window.addEventListener("focus", async () => {
    const children = await bookmarks.getChildren(params.id);
    state.merge(children);
  });

  function onMove(node: Bookmarks.BookmarkTreeNode, endIdx: number) {
    browser.bookmarks.move(node.id, {
      parentId: node.parentId,
      index: endIdx,
    });
  }

  const [move, setMove] = createSignal<{
    node: Bookmarks.BookmarkTreeNode;
    endIdx: number;
  } | null>();

  createDebounced(move, (m) => {
    if (m != null) onMove(m.node, m.endIdx);
  });

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
        <Sortable each={state.children()} layout={layout}>
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
