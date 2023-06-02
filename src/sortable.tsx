import {
  Accessor,
  Context,
  For,
  JSX,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
  untrack,
  useContext,
} from "solid-js";
import {
  Position,
  Rect,
  dist,
  elemPagePos,
  elemPageRect,
  elemSize,
  intersects,
} from "./utils/geom";
import { Size } from "./utils/image";

interface SortableHooks<T> {
  readonly onClick?: (item: T, idx: number) => void;
  readonly onDragStart?: (item: T, idx: number) => void;
  readonly onDragEnd?: (
    item: T,
    startIdx: number | null,
    endIdx: number
  ) => void;
  readonly onMove?: (item: T, fromIdx: number, toIdx: number) => void;
  readonly onRemove?: (item: T, idx: number) => void;
  readonly onInsert?: (item: T, idx: number) => void;
}

function createSortableHooksDispatcher<T>(
  source: SortableHooks<T>
): SortableHooks<T> {
  return {
    onClick: (item, idx) => source.onClick?.(item, idx),
    onDragStart: (item, idx) => source.onDragStart?.(item, idx),
    onDragEnd: (item, startIdx, endIdx) =>
      source.onDragEnd?.(item, startIdx, endIdx),
    onMove: (item, fromIdx, toIdx) => source.onMove?.(item, fromIdx, toIdx),
    onRemove: (item, idx) => source.onRemove?.(item, idx),
    onInsert: (item, idx) => source.onInsert?.(item, idx),
  };
}

interface SortableRef<T> {
  readonly ref: HTMLDivElement;
  readonly checkIndex?: (rect: Rect) => number | null;
  readonly hooks: SortableHooks<T>;
}

interface SortableMouseDown<T> {
  readonly item: T;
  readonly ref: HTMLElement;
  readonly pos: Position; // reletive to item
}

interface DragHandler<T> {
  readonly dragging: Accessor<T | undefined>;
  readonly startDrag: (
    item: T,
    idx: number,
    itemElem: HTMLElement,
    source: SortableRef<T>,
    sourceElem: HTMLDivElement,
    e: MouseEvent
  ) => void;
  readonly continueDrag: (
    item: T,
    idx: number,
    itemElem: HTMLElement,
    source: SortableRef<T>,
    sourceElem: HTMLDivElement
  ) => void;
}

function createDragHandler<T>(sortables?: Set<SortableRef<T>>): DragHandler<T> {
  const [dragging, setDragging] = createSignal<Exclude<T, Function>>();

  return {
    dragging,
    startDrag: (item, idx, itemElem, source, sourceElem, e) => {
      setDragging(item as any); // solid setters don't work well with generics
    },
    continueDrag: (item, idx, itemElem, source, sourceElem) => {},
  };
}

// function handleMouseDown<T>(
//   source: SortableRef<T>,
//   sortables: Set<SortableRef<T>>,
//   item: T,
//   idx: number,
//   itemElem: HTMLElement,
//   e: MouseEvent
// ) {
//   let mouseDownTime = Date.now();
//   let mouseMoveDist = 0;
//   let mouseMove: Position = { x: 0, y: 0 };
//   let mouseMovePrev: Position = { x: 0, y: 0 };
//   const mouseDownPos = {
//     x: e.x - rect.x,
//     y: e.y - rect.y,
//   },

//   const updateMouseData = (event: MouseEvent) => {
//     mouseMove = { x: event.pageX, y: event.pageY };
//     mouseMoveDist += dist(mouseMove, mouseMovePrev);
//     mouseMovePrev = mouseMove;
//   };

//   const updateContainerPosition = () => {
//     const pos = elemPagePos(containerElem);
//     const x = mouseMove.x - mouseDownPos.x - pos.x;
//     const y = mouseMove.y - mouseDownPos.y - pos.y;
//     itemElem.style.transform = `translate(${x}px, ${y}px)`;

//     // calculate new index
//     const newIndex = source.checkIndex?.(elemPageRect(itemElem));

//     // move item if calculated index is not the same as current index
//     if (newIndex != null && newIndex != idx()) {
//       props.onMove?.(item, idx(), newIndex);
//     }
//   };

//   if (sortableContext?.mouseDown() == item) {
//     attachListeners();
//   }

//   const mouseDownListener = (e: MouseEvent) => {

//     const rect = itemElem.getBoundingClientRect();
//     setMouseDown({
//       item,
//       ref: itemElem,
//       pos:
//     });
//     attachListeners();
//   };

//   const onMouseMove = (e: MouseEvent) => {
//     console.log("moving");
//     updateMouseData(e);
//     updateContainerPosition();
//   };

//   const onScroll = () => {
//     updateContainerPosition();
//   };

//   const onMouseUp = (e: MouseEvent) => {
//     if (
//       e.button == 0 &&
//       selected() &&
//       (Date.now() - mouseDownTime < 100 || mouseMoveDist < 8) &&
//       props.onClick != null
//     ) {
//       // make sure errors in callback don't mess with internal logic
//       try {
//         props.onClick(item, idx());
//       } catch (e) {
//         console.error(e);
//       }
//     }

//     removeListeners();
//   };

//   function attachListeners() {
//     document.addEventListener("mousemove", onMouseMove);
//     document.addEventListener("scroll", onScroll);
//     document.addEventListener("mouseup", onMouseUp);
//   }

//   function removeListeners() {
//     document.removeEventListener("mousemove", onMouseMove);
//     document.removeEventListener("scroll", onScroll);
//     document.removeEventListener("mouseup", onMouseUp);
//   }
// }

interface SortableContextValue<T> {
  readonly mountSortable: (sortable: SortableRef<T>) => void;
  readonly removeSortable: (sortable: SortableRef<T>) => void;
  readonly dragHandler: DragHandler<T>;
}

type SortableContext<T> = Context<SortableContextValue<T>>;

export function createSortableContext<T>(): SortableContext<T> {
  return createContext<SortableContextValue<T>>({} as SortableContextValue<T>);
}

export function createSortableContextValue<T>(): SortableContextValue<T> {
  const sortables = new Set<SortableRef<T>>();
  return {
    mountSortable: (ref: SortableRef<T>) => {
      sortables.add(ref);
    },
    removeSortable: (ref: SortableRef<T>) => {
      sortables.delete(ref);
    },
    dragHandler: createDragHandler(sortables),
  };
}

interface SortableItemProps<T> {
  readonly item: T;
  readonly idx: Accessor<number>;
  readonly selected: Accessor<boolean>;
  readonly containerRef: (el: HTMLElement) => void;
  readonly handleRef: (el: HTMLElement) => void;
}

type SortableItemContext<T> = Context<SortableItemProps<T>>;

export function createSortableItemContext<T>(): SortableItemContext<T> {
  return createContext<SortableItemProps<T>>({} as SortableItemProps<T>);
}

interface Layout {
  readonly height: string;
  readonly width: string;
  readonly pos: (idx: number) => Position;
  readonly checkIndex?: (rect: Rect) => number | null;
}
interface Layouter {
  readonly mount?: (elem: HTMLDivElement) => void;
  readonly unmount?: () => void;
  readonly layout: (sizes: ReadonlyArray<Size>) => Layout;
}

interface SortableProps<T, U extends JSX.Element> extends SortableHooks<T> {
  readonly context?: SortableContext<T>; // cannot be changed dynamically

  readonly each: ReadonlyArray<T>;
  readonly layout: Layouter;
  readonly children: (props: SortableItemProps<T>) => U;

  readonly animDurationMs?: number;
  readonly animEasing?: string;
}

export function Sortable<T, U extends JSX.Element>(props: SortableProps<T, U>) {
  const sortableContext = props.context && useContext(props.context);

  let containerRef: HTMLDivElement | undefined;
  let sortableRef: SortableRef<T> | undefined;

  createEffect(
    on(
      () => props.layout,
      (layouter, prevLayouter) => {
        layouter.mount?.(containerRef!);
        onCleanup(() => prevLayouter?.unmount?.());
      }
    )
  );

  const itemToContainer = new Map<T, HTMLElement>();
  const [containers, setContainers] = createSignal<ReadonlyArray<HTMLElement>>(
    []
  );
  const layouter = createMemo(() => props.layout);
  const layout = createMemo(() =>
    layouter().layout(containers().map(elemSize))
  );

  function updateContainers() {
    const each = untrack(() => props.each);
    if (each.length == itemToContainer.size) {
      setContainers(
        each.map((item) => {
          const value = itemToContainer.get(item);
          if (value == null)
            throw new Error("item size map out of sync with items");
          return value;
        })
      );
    }
  }

  createEffect(on(() => props.each, updateContainers, { defer: true }));

  const dragHandler: DragHandler<T> =
    sortableContext != null ? sortableContext.dragHandler : createDragHandler();

  onMount(() => {
    sortableRef = {
      ref: containerRef!,
      checkIndex: (rect) => layout().checkIndex?.(rect) ?? null,
      hooks: createSortableHooksDispatcher(props),
    };
    if (sortableContext != null) {
      sortableContext.mountSortable(sortableRef);
    }
    onCleanup(() => {
      if (sortableContext != null) {
        sortableContext.removeSortable(sortableRef!);
      }
    });
  });

  return (
    <div
      ref={containerRef}
      style={{ width: layout().width, height: layout().height }}
    >
      <For each={props.each}>
        {(item, idx) => {
          let itemRef: HTMLElement | undefined;
          let handleRef: HTMLElement | undefined;

          const selected = createMemo(
            on(
              dragHandler.dragging,
              (dragging) => dragging != null && item === dragging
            )
          );

          onMount(() => {
            const sortable = sortableRef!;
            const containerElem = containerRef!;
            const itemElem = itemRef!;
            const handleElem = handleRef == null ? itemElem : handleRef;

            // manage html element map used for layouting
            itemToContainer.set(item, itemElem);
            updateContainers();
            onCleanup(() => itemToContainer.delete(item));

            // reactivley calc position and apply animation effect
            let anim: Animation | undefined;
            const pos = createMemo(() => layout().pos(idx()));
            createEffect(() => {
              if (!selected() && !isNaN(pos().x) && !isNaN(pos().y)) {
                if (!itemElem.style.transform) {
                  // don't use animation when setting initial position
                  const transform = `translate(${pos().x}px, ${pos().y}px)`;
                  itemElem.style.transform = transform;
                } else {
                  itemElem.classList.add("released");
                  anim = itemElem.animate(
                    {
                      transform: `translate(${pos().x}px, ${pos().y}px)`,
                    },
                    {
                      duration: props.animDurationMs ?? 250,
                      easing: props.animEasing ?? "ease",
                      fill: "forwards",
                    }
                  );
                  anim.onfinish = () => itemElem.classList.remove("released");
                  anim.commitStyles();
                }
              }
            });

            if (item === dragHandler.dragging()) {
              dragHandler.continueDrag(
                item,
                idx(),
                itemElem,
                sortable,
                containerElem
              );
            }
            const mouseDownListener = (e: MouseEvent) => {
              dragHandler.startDrag(
                item,
                idx(),
                itemElem,
                sortable,
                containerElem,
                e
              );
            };
            handleElem.addEventListener("mousedown", mouseDownListener);
            onCleanup(() =>
              handleElem.removeEventListener("mousedown", mouseDownListener)
            );
          });

          return props.children({
            item,
            idx,
            selected: selected,
            containerRef: (el) => (itemRef = el),
            handleRef: (el) => (handleRef = el),
          });
        }}
      </For>
    </div>
  );
}

/**
 * Lays out an array of elements in a grid with elements going from left to right and wrapping
 * based on the width of the containing element. Every element of the layout should be equally
 * sized otherwise this layout may not behave correctly.
 *
 * @param trackRelayout hook for reactive variable changes to cause a relayout
 */
export function flowGridLayout(trackRelayout?: () => void): Layouter {
  function calcHeight(
    n: number,
    width: number,
    itemWidth: number,
    itemHeight: number
  ) {
    return Math.ceil(n / Math.floor(width / itemWidth)) * itemHeight;
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
            Math.min(
              rows - 1,
              Math.floor((y + y + itemHeight) / 2 / itemHeight)
            )
          );

    return xidx == null || yidx == null ? null : xidx + yidx * cols;
  }

  let observer: ResizeObserver | undefined;
  let container: HTMLElement | undefined;
  const [width, setWidth] = createSignal(0);

  const [relayout, setRelayout] = createSignal(0);
  createEffect(() => {
    trackRelayout?.();
    // delay layout until after reactions are finished
    queueMicrotask(() => setRelayout(relayout() + 1));
  });

  return {
    mount: (elem) => {
      container = elem;
      observer = new ResizeObserver(() => {
        setWidth(elem.getBoundingClientRect().width);
      });
      setWidth(elem.getBoundingClientRect().width);
      observer.observe(elem);
    },
    unmount: () => {
      container = undefined;
      observer?.disconnect();
    },
    layout: (sizes) => {
      relayout();
      const first = sizes.length > 0 ? sizes[0] : null;
      const itemWidth = first != null ? first.width : 0;
      const itemHeight = first != null ? first.height : 0;
      const height = calcHeight(sizes.length, width(), itemWidth, itemHeight);
      const margin = calcMargin(width(), itemWidth);
      return {
        width: "100%",
        height: `${height}px`,
        pos: (idx) => calcPosition(idx, margin, width(), itemWidth, itemHeight),
        checkIndex: (rect: Rect) => {
          if (!intersects(elemPageRect(container!), rect)) return null;
          const idx = calcIndex(
            rect.x,
            rect.y,
            margin,
            width(),
            height,
            itemWidth,
            itemHeight
          );
          if (idx == null) return null;
          else return Math.min(0, Math.max(sizes.length, idx));
        },
      };
    },
  };
}