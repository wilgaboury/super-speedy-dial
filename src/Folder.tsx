import { useNavigate, useParams } from "@solidjs/router";
import { Component, createResource, createSignal, Show } from "solid-js";
import browser, { Bookmarks } from "webextension-polyfill";
import { openTile } from "./Tile";
import Header from "./Header";
import { DragGrid } from "./DragGrid";
import { createDebounced } from "./utils";

const Folder: Component = () => {
  const params = useParams<{ id: string }>();

  const [node] = createResource(
    () => params.id,
    async (id) => (await browser.bookmarks.get(id))[0]
  );

  const [children, { mutate: mutateChildren }] = createResource(
    () => params.id,
    async (id) => await browser.bookmarks.getChildren(id)
  );

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
          each={children()}
          reorder={mutateChildren}
          onClick={(item, e) => openTile(navigate, item, e)}
          onMove={(node, endIdx) => setMove({ node, endIdx })}
          itemWidth={240}
          itemHeight={190}
        />
        <Show when={children() && children()!.length == 0}>
          <div>This Folder Is Empty</div>
        </Show>
      </div>
    </>
  );
};

export default Folder;
