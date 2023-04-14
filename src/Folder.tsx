import { useNavigate, useParams } from "@solidjs/router";
import {
  Component,
  createEffect,
  createResource,
  createSignal,
  Show,
} from "solid-js";
import browser, { Bookmarks, bookmarks } from "webextension-polyfill";
import { openTile } from "./Tile";
import Header from "./Header";
import { DragGrid } from "./DragGrid";
import { createDebounced } from "./utils";
import { createStore, reconcile } from "solid-js/store";

function FolderState() {
  const [state, setState] = createStore<Bookmarks.BookmarkTreeNode[]>([]);
  return {
    reconcile: (nodes: Readonly<Bookmarks.BookmarkTreeNode[]>) =>
      setState((prev) => [
        ...reconcile(nodes, { key: "id", merge: true })(prev),
      ]),
    editBookmark: (idx: number, node: Bookmarks.BookmarkTreeNode) =>
      setState([idx], reconcile(node)),
    getChlidren: (): ReadonlyArray<Bookmarks.BookmarkTreeNode> => state,
  };
}

const Folder: Component = () => {
  const params = useParams<{ id: string }>();

  const [node] = createResource(
    () => params.id,
    async (id) => (await browser.bookmarks.get(id))[0]
  );

  const [nodesLoaded, setNodesLoaded] = createSignal(false);
  const state = FolderState();
  createEffect(async () => {
    const children = await bookmarks.getChildren(params.id);
    state.reconcile(children);
    setNodesLoaded(true);
  });

  window.addEventListener("focus", async () => {
    const children = await bookmarks.getChildren(params.id);
    state.reconcile(children);
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

  return (
    <>
      <Show when={node()}>{(nnNode) => <Header node={nnNode()} />}</Show>
      <div class="grid-container">
        <DragGrid
          each={state.getChlidren()}
          reorder={state.reconcile}
          onClick={(item, e) => openTile(navigate, item, e)}
          onMove={(node, endIdx) => setMove({ node, endIdx })}
          itemWidth={240}
          itemHeight={190}
        />
        {/* TODO: make the empty message prettier */}
        {/* <Show when={nodesLoaded() && nodes.length == 0}>
          <div>This Folder Is Empty</div>
        </Show> */}
      </div>
    </>
  );
};

export default Folder;
