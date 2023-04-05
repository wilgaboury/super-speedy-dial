import {
  Accessor,
  For,
  ParentComponent,
  Setter,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  onMount,
  untrack,
} from "solid-js";
import Tile from "./Tile";
import { Bookmarks, bookmarks } from "webextension-polyfill";

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

function calcIndex(
  x: number,
  y: number,
  margin: number,
  boundingWidth: number,
  boudningHeight: number,
  itemWidth: number,
  itemHeight: number
) {
  const cols = Math.floor(boundingWidth / itemWidth);
  const rows = Math.floor(boudningHeight / itemHeight);
  const xidx =
    x + itemWidth < margin || x > boundingWidth - margin
      ? undefined
      : Math.max(
          0,
          Math.min(
            cols - 1,
            Math.floor(((x + x + itemWidth) / 2 - margin) / itemWidth)
          )
        );
  const yidx =
    y + itemHeight < 0 || y > boudningHeight
      ? undefined
      : Math.max(
          0,
          Math.min(rows - 1, Math.floor((y + y + itemHeight) / 2 / itemHeight))
        );

  return xidx == null || yidx == null ? null : xidx + yidx * cols;
}

interface GridItemContextValue {
  readonly selected: Accessor<boolean>;
  readonly containerRef: (el: HTMLElement) => void;
  readonly handleRef: (el: HTMLElement) => void;
  readonly onDelete: () => void;
}

export const GridItemContext = createContext<GridItemContextValue>({
  selected: () => false,
  containerRef: () => {},
  handleRef: () => {},
  onDelete: () => {},
});

export function DragGrid(props: {
  readonly class?: string;
  readonly each: ReadonlyArray<Bookmarks.BookmarkTreeNode> | undefined | null;
  readonly reorder: Setter<ReadonlyArray<Bookmarks.BookmarkTreeNode>>;
  readonly onMove?: (item: Bookmarks.BookmarkTreeNode, idx: number) => void;
  readonly onClick?: (item: Bookmarks.BookmarkTreeNode, e: MouseEvent) => void;

  readonly itemWidth: number;
  readonly itemHeight: number;
}) {
  let gridRef: HTMLDivElement | undefined;

  const [boundingWidth, setBoundingWidth] = createSignal(0);
  const n = createMemo(() => (props.each ? props.each.length : 0));
  const boundingHeight = createMemo(() =>
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
      style={{ "min-height": `${boundingHeight()}px` }}
      ref={gridRef}
    >
      <For each={props.each}>
        {(item, idx) => {
          let containerRef: HTMLElement | undefined;
          let handleRef: HTMLElement | undefined;

          const [selected, setSelected] = createSignal(false);

          onMount(() => {
            const grid = gridRef!;
            const container = containerRef!;
            const handle = handleRef == null ? container : handleRef;

            // Set position initially without animation
            const initPos = untrack(() => idxToPos(idx()));
            container.style.transform = `translate(${initPos.x}px, ${initPos.y}px)`;

            // if any calc position and reactivley apply animation effect
            let anim: Animation | undefined;
            const pos = createMemo(() => idxToPos(idx()));
            createEffect(() => {
              if (!selected()) {
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

            handle.addEventListener("mousedown", (e) => {
              if (e.button != 0) return;

              const containerRect = container.getBoundingClientRect();

              // track mousedown initial position and time
              const mouseDownTime = Date.now();
              const mouseDownX = e.clientX - containerRect.left;
              const mouseDownY = e.clientY - containerRect.top;

              // track distance of mouse movement during drag
              let mouseMoveDist = 0;
              let mouseMoveX = e.x;
              let mouseMoveY = e.y;
              let mouseMoveLastX = e.x;
              let mouseMoveLastY = e.y;

              if (anim != null) anim.cancel();

              const updateMouseData = (event: MouseEvent) => {
                mouseMoveX = event.x;
                mouseMoveY = event.y;

                // incorperate scrolling
                mouseMoveDist += Math.sqrt(
                  Math.pow(mouseMoveLastX - mouseMoveX, 2) +
                    Math.pow(mouseMoveLastY - mouseMoveY, 2)
                );

                mouseMoveLastX = mouseMoveX;
                mouseMoveLastY = mouseMoveY;
              };

              const updateContainerPosition = () => {
                const rect = grid.getBoundingClientRect();

                const x = mouseMoveX - mouseDownX - rect.x;
                const y = mouseMoveY - mouseDownY - rect.y;
                container.style.transform = `translate(${x}px, ${y}px)`;

                // calculate new index
                const newIndex = untrack(() =>
                  calcIndex(
                    x,
                    y,
                    margin(),
                    boundingWidth(),
                    boundingHeight(),
                    props.itemWidth,
                    props.itemHeight
                  )
                );
                const each = props.each;
                const i = untrack(idx);

                // move item if calculated index is not the same as current index
                if (
                  newIndex != null &&
                  newIndex != i &&
                  each != null &&
                  newIndex < each.length
                ) {
                  const newEach = [
                    ...each.slice(0, i),
                    ...each.slice(i + 1, each.length),
                  ];
                  newEach.splice(newIndex, 0, item);
                  props.reorder(newEach);

                  // call onMove callback
                  if (props.onMove != null) props.onMove(item, newIndex);
                }
              };

              const onMouseMove = (e: MouseEvent) => {
                updateMouseData(e);
                updateContainerPosition();
              };

              const onScroll = (e: Event) => {
                updateContainerPosition();
              };

              const onMouseUp = (e: MouseEvent) => {
                if (
                  e.button == 0 &&
                  selected() &&
                  (Date.now() - mouseDownTime < 100 || mouseMoveDist < 8) &&
                  props.onClick != null
                ) {
                  // make sure errors in callback don't mess with internal logic
                  try {
                    props.onClick(item, e);
                  } catch (e) {
                    console.error(e);
                  }
                }

                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("scroll", onScroll);
                document.removeEventListener("mouseup", onMouseUp);
                setSelected(false);
              };

              updateContainerPosition();
              document.addEventListener("mousemove", onMouseMove);
              document.addEventListener("scroll", onScroll);
              document.addEventListener("mouseup", onMouseUp);
              setSelected(true);
            });
          });

          return (
            <GridItemContext.Provider
              value={{
                selected,
                containerRef: (el) => (containerRef = el),
                handleRef: (el) => (handleRef = el),
                onDelete: () => {
                  const each = props.each;
                  if (each != null) {
                    props.reorder([
                      ...each.slice(0, idx()),
                      ...each.slice(idx() + 1, each.length),
                    ]);
                    bookmarks.remove(item.id);
                  }
                },
              }}
            >
              <Tile node={item} />
            </GridItemContext.Provider>
          );
        }}
      </For>
    </div>
  );
}
