import { useNavigate, useParams } from "@solidjs/router";
import { Component, createResource, createSignal } from "solid-js";
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

  const [children, { mutate, refetch }] = createResource(
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
        <div class="back-button button borderless-button" onClick={goBack}>
          <span style={{ "font-size": "15px", "margin-right": "10px" }}>
            <BiRegularLeftArrowAlt size="15px" />
          </span>
          <span>Back</span>
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
            console.log("move");

            browser.bookmarks.move(c[startIdx].id, {
              parentId: parent.id,
              index: endIdx,
            });
          }
        }}
      >
        {(item) => <Tile node={item} />}
      </Sortable>
    </div>
  );
};

export default Folder;
