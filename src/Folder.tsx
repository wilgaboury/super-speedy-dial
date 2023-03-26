import { useNavigate, useParams } from "@solidjs/router";
import {
  Component,
  createEffect,
  createResource,
  createSignal,
  onMount,
} from "solid-js";
import Muuri, { DraggerMoveEvent, Item } from "muuri";
import { BiRegularLeftArrowAlt } from "solid-icons/bi";
import browser, { Bookmarks } from "webextension-polyfill";
import BookmarkTile from "./BookmarkTile";
import { render } from "solid-js/web";
import Grid from "muuri";

interface MoveEvent {
  item: Item;
  fromIndex: number;
  toIndex: number;
  action: "move" | "swap";
}

const Folder: Component = () => {
  const params = useParams<{ id: string }>();
  const [node] = createResource(
    () => params.id,
    async (id) => {
      const nodes = await browser.bookmarks.get(id);
      const children = await browser.bookmarks.getChildren(id);
      const result = nodes[0];
      result.children = children;
      return result;
    }
  );

  createEffect(() => console.log(node()));

  const navigate = useNavigate();

  function pushNodeStack(id: string) {
    navigate(`/folder/${id}`);
  }

  function popNodeStack() {
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

  let grid: Grid | undefined;

  onMount(() => {
    const muuri = new Muuri(".grid", { dragEnabled: true });
    grid = muuri;

    let destroyers: Array<() => void> = [];
    createEffect(() => {
      muuri.remove(muuri.getItems());
      for (const destroyer of destroyers) destroyer();

      if (node() == null) return;

      const children = node()!.children ?? [];
      for (const child of children) {
        const elem = document.createElement("div");
        elem.classList.add("item");
        destroyers.push(render(() => <BookmarkTile node={child} />, elem));
        muuri.add(elem);
      }
    });
  });

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
          class="back-button button borderless-button"
          onClick={popNodeStack}
        >
          <span style={{ "font-size": "15px", "margin-right": "10px" }}>
            <BiRegularLeftArrowAlt size="15px" />
          </span>
          <span>Back</span>
        </div>
      </div>
      <div class="grid" />
    </div>
  );
};

export default Folder;
