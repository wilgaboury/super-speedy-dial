import {
  Component,
  createEffect,
  createUniqueId,
  JSX,
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
  let mount: HTMLDivElement | undefined = undefined; // ref

  onMount(() => {
    const muuri = new Muuri(mount!, {
      dragEnabled: true,
      // TODO: figure out why autoscroll doesn't work
      // dragAutoScroll: {
      //   targets: [window],
      // },
    });

    const elems = new Map<string, ItemAndCleanup>();

    createEffect(
      on(
        () => props.each,
        (_, prevOrNull) => {
          const each = !props.each ? [] : props.each;
          const prev = !prevOrNull ? [] : prevOrNull;

          const removed = prev
            .filter((e) => !each.includes(e))
            .map((e) => {
              return { each: e, elem: elems.get(e.id) };
            })
            .filter(({ elem }) => elem != null);

          removed.forEach(({ elem }) => elem!.cleanup());
          muuri.remove(
            removed.map(({ elem }) => elem!.item),
            { removeElements: true }
          );
          removed.forEach(({ each }) => elems.delete(each.id));

          const added = each.filter((e) => !prev.includes(e));
          added.forEach((e, i) => {
            const elem = document.createElement("div");
            elem.classList.add("item", e.id);
            const cleanup = render(() => props.children(e), elem);
            const item = muuri.add(elem, { index: i })[0];
            elems.set(e.id, { item, cleanup });
          });
        }
      )
    );

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
      if (dragStart && props.onMove != null) {
        props.onMove(dragStartIndex!, dragEndIndex!);
      }

      dragStartDetected = false;
      dragStart = false;
    });
  });

  return <div ref={mount} class="grid" />;
};

export default Sortable;
