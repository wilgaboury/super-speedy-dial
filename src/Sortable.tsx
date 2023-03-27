import {
  Accessor,
  Component,
  createEffect,
  createMemo,
  createUniqueId,
  JSX,
  mapArray,
  on,
  onMount,
} from "solid-js";
import Muuri, { Item } from "muuri";
import { render } from "solid-js/web";
import { Bookmarks } from "webextension-polyfill";

interface SortableProps {
  readonly each:
    | ReadonlyArray<Bookmarks.BookmarkTreeNode>
    | undefined
    | null
    | false;
  readonly onMove?: (startIndex: number, endIndex: number) => void;
  readonly children: (node: Bookmarks.BookmarkTreeNode) => JSX.Element;
}

interface ItemAndCleanup {
  readonly item: Item;
  readonly cleanup: () => void;
}

const Sortable: Component<SortableProps> = (props) => {
  const id = createUniqueId();

  onMount(() => {
    const mount = document.getElementById(id)!;

    const muuri = new Muuri(mount, {
      dragEnabled: true,
    });

    const elems = new Map<string, ItemAndCleanup>();
    createEffect(() => {
      const eachs = !props.each ? [] : props.each;

      const ids = new Set<string>();

      for (const each of eachs) {
        ids.add(each.id);
      }

      const deleteIds = new Set<string>();

      elems.forEach((v, k) => {
        if (!ids.has(k)) {
          deleteIds.add(k);
          v.cleanup();
          muuri.remove([v.item], { removeElements: true });
        }
      });

      deleteIds.forEach((k) => elems.delete(k));

      eachs.forEach((each, index) => {
        const elem = document.createElement("div");
        elem.classList.add("item", each.id);
        const cleanup = render(() => props.children(each), elem);
        const item = muuri.add(elem, { index: index })[0];
        elems.set(each.id, { item, cleanup });
      });
    });

    let dragStartDetected = false;
    let dragStart = false;
    let recordFirstMoveEvent = false;
    let dragStartIndex: number | undefined;
    let dragEndIndex: number | undefined;

    document.documentElement.addEventListener("mousemove", () => {
      if (dragStartDetected) {
        dragStart = true;
      }
    });
    muuri.on("dragStart", () => {
      dragStartDetected = true;
      recordFirstMoveEvent = true;
    });
    muuri.on("move", (data) => {
      if (recordFirstMoveEvent) {
        recordFirstMoveEvent = false;
        dragStartIndex = data.fromIndex;
      }
      dragEndIndex = data.toIndex;
    });
    muuri.on("dragEnd", () => {
      console.log(dragStart);
      if (dragStart && props.onMove != null) {
        props.onMove(dragStartIndex!, dragEndIndex!);
      }

      dragStartDetected = false;
      dragStart = false;
    });
  });

  return <div id={id} class="grid" />;
};

export default Sortable;
