import { useParams } from "@solidjs/router";
import { Component, createResource, Show } from "solid-js";
import browser, { Bookmarks } from "webextension-polyfill";
import Tile from "./Tile";
import Header from "./Header";
import { SortableGrid } from "./DraggableGrid";

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

  return (
    <>
      <Show when={node()}>{(nnNode) => <Header node={nnNode()} />}</Show>
      <div class="grid-container">
        <SortableGrid
          each={children()}
          setEach={mutateChildren}
          onMove={onMove}
          itemWidth={240}
          itemHeight={190}
        >
          {(props) => (
            <Tile node={props.item} containerRef={props.containerRef} />
          )}
        </SortableGrid>
        <Show when={children() && children()!.length == 0}>
          <div>This Folder Is Empty</div>
        </Show>
      </div>
    </>
  );
};

export default Folder;
