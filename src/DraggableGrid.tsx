import {
  For,
  Setter,
  createEffect,
  createMemo,
  createSignal,
  onMount,
  untrack,
} from "solid-js";
import Tile from "./Tile";
import { Bookmarks } from "webextension-polyfill";

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
  index: number,
  margin: number,
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

export function DraggableGrid(props: {
  readonly class?: string;
  readonly each: ReadonlyArray<Bookmarks.BookmarkTreeNode> | undefined | null;
  readonly reorder: Setter<Bookmarks.BookmarkTreeNode>;
  readonly onMove?: (item: Bookmarks.BookmarkTreeNode, idx: number) => void;
  readonly onClick?: (item: Bookmarks.BookmarkTreeNode, e: MouseEvent) => void;

  readonly itemWidth: number;
  readonly itemHeight: number;
}) {
  let gridRef: HTMLDivElement | undefined;

  const [boundingWidth, setBoundingWidth] = createSignal(0);
  const n = createMemo(() => (props.each ? props.each.length : 0));
  const height = createMemo(() =>
    calcHeight(n(), boundingWidth(), props.itemWidth, props.itemHeight)
  );
  const margin = createMemo(() => calcMargin(boundingWidth(), props.itemWidth));

  const idxToPos = (idx: number) =>
    calcPosition(
      idx,
      margin(),
      boundingWidth(),
      props.itemWidth,
      props.itemHeight
    );

  const [mouse, setMouse] = createSignal<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });
  const [scroll, setScroll] = createSignal(0);
  document.addEventListener("mousemove", (event) => {
    const e = event as MouseEvent;
    setMouse({ x: e.x, y: e.y });
  });
  document.addEventListener("scroll", (event) => {
    setScroll(scroll() + 1);
  });

  onMount(() => {
    const grid = gridRef!;
    setBoundingWidth(grid.getBoundingClientRect().width);
    const observer = new ResizeObserver(() =>
      setBoundingWidth(grid.getBoundingClientRect().width)
    );
    observer.observe(grid);
  });

  return (
    <div
      class={props.class ?? "grid"}
      style={{ "min-height": `${height()}px` }}
      ref={gridRef}
    >
      <For each={props.each}>
        {(item, idx) => {
          let containerRef: HTMLElement | undefined;
          let handleRef: HTMLElement | undefined;

          const [selected, setSelected] = createSignal(false);

          onMount(() => {
            const container = containerRef!;
            const handle = handleRef == null ? container : handleRef;

            // Set position initially without animation
            const initPos = untrack(() => idxToPos(idx()));
            container.style.transform = `translate(${initPos.x}px, ${initPos.y}px)`;

            // if any variable changes recalc position and apply movement animation
            const pos = createMemo(() => idxToPos(idx()));

            ///////////// logic for clicking and dragging /////////////////////
            let mouseDownTime = 0;
            let mouseDownX = 0;
            let mouseDownY = 0;

            let mouseMoveDist = Infinity;
            let mouseMoveLastX = 0;
            let mouseMoveLastY = 0;

            let anim: Animation | undefined;
            createEffect(() => {
              if (selected()) {
                scroll();
                const m = mouse();
                const rect = gridRef?.getBoundingClientRect()!;
                const x = m.x - mouseDownX - rect.x;
                const y = m.y - mouseDownY - rect.y;

                container.style.transform = `translate(${x}px, ${y}px)`;

                mouseMoveDist += Math.sqrt(
                  Math.pow(mouseMoveLastX - m.x, 2) +
                    Math.pow(mouseMoveLastY - m.y, 2)
                );
                mouseMoveLastX = m.x;
                mouseMoveLastY = m.y;
              } else {
                container.classList.add("released");
                anim = container.animate(
                  {
                    transform: `translate(${pos().x}px, ${pos().y}px)`,
                  },
                  { duration: 250, fill: "forwards", easing: "ease" }
                );
                anim.onfinish = () => container.classList.remove("released");
                anim.commitStyles();
              }
            });

            handle.addEventListener("mousedown", (event) => {
              const e = event as MouseEvent;
              if (e.button == 0) {
                mouseDownTime = Date.now();

                mouseMoveDist = 0;
                mouseMoveLastX = e.pageX;
                mouseMoveLastY = e.pageY;

                const rect = container.getBoundingClientRect();
                mouseDownX = e.clientX - rect.left;
                mouseDownY = e.clientY - rect.top;

                if (anim != null) {
                  anim.cancel();
                }

                setMouse({ x: e.x, y: e.y });
                setSelected(true);
              }

              const onMouseUp = (e: MouseEvent) => {
                if (
                  e.button == 0 &&
                  selected() &&
                  (Date.now() - mouseDownTime < 100 || mouseMoveDist < 8) &&
                  props.onClick != null
                ) {
                  props.onClick(item, e);
                }
                document.removeEventListener("mouseup", onMouseUp);
                setSelected(false);
              };

              document.addEventListener("mouseup", onMouseUp);
            });
          });

          return (
            <Tile
              node={item}
              selected={selected()}
              containerRef={(el) => (containerRef = el)}
              handleRef={(el) => (handleRef = el)}
            />
          );
        }}
      </For>
    </div>
  );
}
