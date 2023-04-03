import {
  For,
  JSX,
  createEffect,
  createMemo,
  createSignal,
  onMount,
  untrack,
} from "solid-js";

function calcHeight(
  n: number,
  boundingWidth: number,
  itemWidth: number,
  itemHeight: number
) {
  return Math.ceil(n / Math.floor(boundingWidth / itemWidth)) * itemHeight;
}

function calcMargin(boundingWidth: number, itemWidth: number) {
  return Math.floor((boundingWidth % itemWidth) / 2);
}

function calcPosition(
  margin: number,
  index: number,
  boundingWidth: number,
  itemWidth: number,
  itemHeight: number
) {
  const perRow = Math.floor(boundingWidth / itemWidth);
  return {
    x: margin + itemWidth * (index % perRow),
    y: itemHeight * Math.floor(index / perRow),
  };
}

export interface SortableGridItemProps<T extends readonly any[]> {
  item: T[number];
  width: number;
  height: number;
  containerRef: (el: HTMLElement) => void;
  handleRef: (el: HTMLElement) => void;
}

export function SortableGrid<
  T extends readonly any[],
  U extends JSX.Element
>(props: {
  readonly class?: string;
  readonly each: T | undefined | null;

  readonly itemWidth: number;
  readonly itemHeight: number;
  readonly children: (props: SortableGridItemProps<T>) => U;
}) {
  let gridRef: HTMLDivElement | undefined;

  const [selected, setSelected] = createSignal<T>();
  const [boundingWidth, setBoundingWidth] = createSignal(0);
  const n = createMemo(() => (props.each ? props.each.length : 0));
  const height = createMemo(() =>
    calcHeight(n(), boundingWidth(), props.itemWidth, props.itemHeight)
  );
  const margin = createMemo(() => calcMargin(boundingWidth(), props.itemWidth));

  onMount(() => {
    const grid = gridRef!;
    setBoundingWidth(grid.getBoundingClientRect().width);

    const observer = new ResizeObserver((entries) => {
      console.log("observed");
      for (const entry of entries) {
        setBoundingWidth(grid.getBoundingClientRect().width);
      }
    });
    observer.observe(grid);
  });
  return (
    <div
      class={props.class ?? "grid"}
      style={{ height: `${height()}px` }}
      ref={gridRef}
    >
      <For each={props.each}>
        {(item, idx) => {
          let containerRef: HTMLElement | undefined;
          let handleRef: HTMLElement | undefined;

          onMount(() => {
            const container = containerRef!;
            const handle = handleRef!;

            const initPos = untrack(() =>
              calcPosition(
                margin(),
                idx(),
                boundingWidth(),
                props.itemWidth,
                props.itemHeight
              )
            );
            container.style.transform = `translate(${initPos.x}px, ${initPos.y}px)`;

            const pos = createMemo(() =>
              calcPosition(
                margin(),
                idx(),
                boundingWidth(),
                props.itemWidth,
                props.itemHeight
              )
            );
            createEffect(() => {
              if (untrack(() => item !== selected())) {
                const anim = container.animate(
                  {
                    transform: `translate(${pos().x}px, ${pos().y}px)`,
                  },
                  { duration: 250, fill: "forwards" }
                );
                anim.commitStyles();
              }
            });
          });

          return props.children({
            item,
            width: props.itemWidth,
            height: props.itemHeight,
            containerRef: (el) => (containerRef = el),
            handleRef: (el) => (handleRef = el),
          });
        }}
      </For>
    </div>
  );
}
