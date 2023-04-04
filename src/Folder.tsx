import { useNavigate, useParams } from "@solidjs/router";
import { Component, createResource, Show } from "solid-js";
import browser, { Bookmarks } from "webextension-polyfill";
import { openTile } from "./Tile";
import Header from "./Header";
import { DraggableGrid } from "./DraggableGrid";

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

  const navigate = useNavigate();

  return (
    <>
      <Show when={node()}>{(nnNode) => <Header node={nnNode()} />}</Show>
      <div class="grid-container">
        <DraggableGrid
          each={children()}
          reorder={mutateChildren}
          onClick={(item, e) => openTile(navigate, item, e)}
          onMove={onMove} // might want to debounce this but the performance seems fine so :/
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
