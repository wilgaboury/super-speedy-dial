import { useNavigate, useParams } from "@solidjs/router";
import { Component, createResource, createSignal, Show } from "solid-js";
import { BiRegularLeftArrowAlt } from "solid-icons/bi";
import browser, { Bookmarks } from "webextension-polyfill";
import Tile from "./Tile";
import Sortable from "./Sortable";

const Folder: Component = () => {
  const params = useParams<{ id: string }>();
  const [node] = createResource(
    () => params.id,
    async (id) => (await browser.bookmarks.get(id))[0]
  );

  const [children, setChildren] = createResource(
    () => params.id,
    async (id) => await browser.bookmarks.getChildren(id)
  );

  const navigate = useNavigate();

  function goBack() {
    if (node() != null && node()!.parentId != null) {
      navigate(`/folder/${node()!.parentId}`);
    }
  }

  function calculateGridPadding() {
    const bodyWidth = document.documentElement.offsetWidth;
    return (((bodyWidth - 100 - 1) % 240) + 100) / 2;
  }
  const [gridPadding, setGridPadding] = createSignal<number>(
    calculateGridPadding()
  );
  window.addEventListener("resize", () =>
    setGridPadding(calculateGridPadding())
  );

  return (
    <div
      class="grid-container"
      style={
        gridPadding() == null
          ? { "padding-left": "50px", "padding-right": "50px" }
          : {
              "padding-left": `${gridPadding()}px`,
              "padding-right": `${gridPadding()}px`,
            }
      }
    >
      <div class="back-button-container">
        <div
          class="back-button button borderless-button transparent-button"
          style={{ opacity: node()?.parentId == null ? 0 : 1 }}
          onClick={goBack}
        >
          <BiRegularLeftArrowAlt
            style={{ "margin-right": "6px" }}
            size="26px"
          />
          <div>Back</div>
        </div>
      </div>
      <Sortable
        each={children()}
        onMove={(startIdx, endIdx) => {
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
            setChildren.mutate(cNew);

            browser.bookmarks.move(c[startIdx].id, {
              parentId: parent.id,
              index: endIdx,
            });
          }
        }}
      >
        {(item) => <Tile node={item} />}
      </Sortable>
      <Show when={children() != null && children()!.length == 0}>
        <div>This Folder Is Empty</div>
      </Show>
    </div>
  );
};

export default Folder;
