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

interface SortableProps {
  readonly each: ReadonlyArray<any> | undefined | null | false;
  readonly children: (item: any, index: Accessor<number>) => JSX.Element;
}

interface ItemAndCleanup {
  readonly item: Item;
  readonly cleanup: () => void;
}

const Sortable: Component<SortableProps> = (props) => {
  const id = createUniqueId();

  createEffect(
    on(
      () => props.each,
      () =>
        console.log(
          `each property changed, size: ${
            props.each instanceof Array ? props.each.length : 0
          }`
        )
    )
  );

  onMount(() => {
    const muuri = new Muuri(`#${id}`, {
      dragEnabled: true,
    });

    const items = createMemo(
      mapArray(
        () => props.each,
        (each, index) => {
          const elem = document.createElement("div");
          elem.classList.add("item");
          const cleanup = render(() => props.children(each, index), elem);
          const item = muuri.add(elem, { index: index() })[0];
          return { item, cleanup } as ItemAndCleanup;
        }
      )
    );

    createEffect(
      on(items, (_, prev) => {
        if (prev == null) return;

        prev
          .filter((i) => !items().includes(i))
          .forEach((i) => {
            i.cleanup();
            muuri.remove([i.item], { removeElements: true });
          });
      })
    );
  });

  return <div id={id} class="grid" />;
};

export default Sortable;
