import { useNavigate, useParams } from "@solidjs/router";
import { Component, createResource, createSignal, Show } from "solid-js";
import { BiRegularLeftArrowAlt } from "solid-icons/bi";
import browser, { Bookmarks } from "webextension-polyfill";
import Tile from "./Tile";
import Sortable from "./Sortable";
import Header from "./Header";
import { SortableGrid } from "./DraggableGrid";

function calculateGridPadding() {
  const bodyWidth = document.documentElement.offsetWidth;
  return (((bodyWidth - 100 - 1) % 240) + 100) / 2;
}

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

  const [gridPadding, setGridPadding] = createSignal<number>(
    calculateGridPadding()
  );
  window.addEventListener("resize", () =>
    setGridPadding(calculateGridPadding())
  );

  function onMove(startIdx: number, endIdx: number) {
    const parent = node();
    const c = children();
    if (
      parent != null &&
      parent.id != null &&
      c != null &&
      c[startIdx] != null
    ) {
      const cNew = [...c];
      const n = cNew.splice(startIdx, 1)[0];
      cNew.splice(endIdx, 0, n);
      mutateChildren(cNew);

      browser.bookmarks.move(c[startIdx].id, {
        parentId: parent.id,
        index: endIdx,
      });
    }
  }

  return (
    <>
      <Show when={node()}>{(nnNode) => <Header node={nnNode()} />}</Show>
      <div
        class="grid-container"
        // style={
        //   gridPadding() == null
        //     ? { "padding-left": "50px", "padding-right": "50px" }
        //     : {
        //         "padding-left": `${gridPadding()}px`,
        //         "padding-right": `${gridPadding()}px`,
        //       }
        // }
      >
        {/* <Sortable each={children() ?? []} onMove={onMove}>
          {(item) => (
            <Tile
              node={item}
              onDelete={() => {
                const cs = children()!;
                const idx = cs.findIndex((e) => e === item);
                mutateChildren([
                  ...cs.slice(0, idx),
                  ...cs.slice(idx + 1, cs.length),
                ]);
                console.log([
                  ...cs.slice(0, idx),
                  ...cs.slice(idx + 1, cs.length),
                ]);
              }}
            />
          )}
        </Sortable> */}
        <SortableGrid each={children()} itemWidth={240} itemHeight={190}>
          {(gridItemProps) => (
            <Tile
              node={gridItemProps.item}
              containerRef={gridItemProps.containerRef}
            />
          )}
        </SortableGrid>
        <Show when={children() && children()!.length > 0}>
          <div>This Folder Is Empty</div>
        </Show>
      </div>
    </>
  );
};

export default Folder;
