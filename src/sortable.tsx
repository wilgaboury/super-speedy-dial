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
  useContext,
} from "solid-js";
import {
  Position,
  Rect,
  clientToPage,
  clientToRelative,
  dist,
  elemClientRect,
  elemPageRect,
  intersects,
} from "./utils/geom";
import { Size } from "./utils/image";
import { mod } from "./utils/assorted";

interface SortableHooks<T> {
  readonly onClick?: (item: T, idx: number, e: MouseEvent) => void;
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
    onClick: (item, idx, e) => source.onClick?.(item, idx, e),
    onDragStart: (item, idx) => source.onDragStart?.(item, idx),
    onDragEnd: (item, startIdx, endIdx) =>
      source.onDragEnd?.(item, startIdx, endIdx),
    onMove: (item, fromIdx, toIdx) => source.onMove?.(item, fromIdx, toIdx),
    onRemove: (item, idx) => source.onRemove?.(item, idx),
    onInsert: (item, idx) => source.onInsert?.(item, idx),
  };
}

interface CheckEnd {
  readonly kind: "end";
  readonly idx: number;
}

interface CheckInside {
  readonly kind: "inside";
  readonly idx: number;
}

type CheckResult = CheckEnd | CheckInside;

interface ClickProps {
  readonly clickDurMs?: number;
  readonly clickDistPx?: number;
}

interface SortableRef<T> {
  readonly ref: HTMLDivElement;
  readonly checkIndex?: (rect: Rect) => CheckResult | undefined;
  readonly hooks: SortableHooks<T>;
}

interface DragHandler<T> {
  readonly mouseDown: Accessor<T | undefined>;
  readonly startDrag: (
    item: T,
    idx: Accessor<number>,
    itemElem: HTMLElement,
    source: SortableRef<T>,
    sourceElem: HTMLDivElement,
    e: MouseEvent,
    clickProps: Accessor<ClickProps>
  ) => void;
  readonly continueDrag: (
    item: T,
    idx: Accessor<number>,
    itemElem: HTMLElement,
    source: SortableRef<T>,
    sourceElem: HTMLDivElement,
    clickProps: Accessor<ClickProps>
  ) => void;
}

function createDragHandler<T>(sortables?: Set<SortableRef<T>>): DragHandler<T> {
  const [mouseDown, setMouseDown] = createSignal<T>();

  let curItem: T | undefined;
  let startItemElem: HTMLElement | undefined;
  let curItemElem: HTMLElement | undefined;
  let curSource: SortableRef<T> | undefined;
  let startSourceElem: HTMLDivElement | undefined;
  let curSourceElem: HTMLDivElement | undefined;

  let mouseDownTime = 0;
  let mouseMoveDist = 0;
  let mouseMove: Position = { x: 0, y: 0 }; // client coords
  let mouseMovePrev: Position = { x: 0, y: 0 }; // page coords
  let mouseDownPos = { x: 0, y: 0 };

  let startIdx: number = 0;
  let dragStarted: boolean = false;

  let curIdx: Accessor<number> = () => 0;
  let curClickProps: Accessor<ClickProps> = () => ({});

  function updateMouseData(e: MouseEvent) {
    mouseMove = { x: e.x, y: e.y };
    updateMouseMoveDist();
    mouseMovePrev = clientToPage(mouseMove);
  }

  function isClick() {
    const elapsed = Date.now() - mouseDownTime;
    const tmpClickProps = curClickProps();
    const clickDurMs = tmpClickProps.clickDurMs ?? 100;
    const clickDistPx = tmpClickProps.clickDistPx ?? 8;
    // TODO also check and make sure index has not changed
    return elapsed < clickDurMs || mouseMoveDist < clickDistPx;
  }

  function updateMouseMoveDist() {
    mouseMoveDist += dist(clientToPage(mouseMove), mouseMovePrev);
  }

  function updateItemElemPosition() {
    if (curItemElem != null && curSourceElem != null) {
      const pos = clientToRelative(mouseMove, curSourceElem);
      const x = pos.x - mouseDownPos.x;
      const y = pos.y - mouseDownPos.y;
      curItemElem.style.transform = `translate(${x}px, ${y}px)`;
    }
  }

  function maybeTriggerMove() {
    const rect = clientToRelative(elemClientRect(curItemElem!), curSourceElem!);
    const checkRes = curSource?.checkIndex?.(rect);
    if (checkRes?.kind === "inside") {
      curSource?.hooks?.onMove?.(curItem!, curIdx(), checkRes.idx);
      return;
    }

    if (sortables != null) {
      for (const sortable of sortables) {
        const checkRes = sortable.checkIndex?.(rect);
        if (checkRes?.kind === "inside" || checkRes?.kind === "end") {
          curSource?.hooks?.onRemove?.(curItem!, curIdx());
          sortable?.hooks?.onInsert?.(curItem!, checkRes.idx);
          return;
        }
      }
    }
  }

  const onMouseUp = (e: MouseEvent) => {
    removeListeners();
    if (e.button == 0 && isClick()) {
      // ensure errors from callback do not intefere with internal state
      try {
        curSource?.hooks?.onClick?.(curItem!, curIdx(), e);
      } catch (err) {
        console.error(err);
      }
    } else {
      curSource?.hooks?.onDragEnd?.(curItem!, startIdx, curIdx());
    }
    setMouseDown(undefined);
  };

  const onMouseMove = (e: MouseEvent) => {
    updateMouseData(e);
    updateItemElemPosition();
    maybeTriggerMove();

    if (!isClick() && !dragStarted) {
      dragStarted = true;
      curSource?.hooks?.onDragStart?.(curItem!, startIdx);
    }
  };

  const onScroll = () => {
    updateMouseMoveDist();
    updateItemElemPosition();
    maybeTriggerMove();
  };

  function addListeners() {
    window.addEventListener("mouseup", onMouseUp, true);
    window.addEventListener("mousemove", onMouseMove, true);
    window.addEventListener("scroll", onScroll, true);
  }

  function removeListeners() {
    window.removeEventListener("mouseup", onMouseUp, true);
    window.removeEventListener("mousemove", onMouseMove, true);
    window.removeEventListener("scroll", onScroll, true);
  }

  return {
    mouseDown,
    startDrag: (item, idx, itemElem, source, sourceElem, e, clickProps) => {
      mouseDownTime = Date.now();
      mouseMoveDist = 0;
      mouseMove = { x: e.x, y: e.y };
      mouseMovePrev = mouseMove;
      mouseDownPos = clientToRelative(mouseMove, itemElem);

      curItem = item;
      startItemElem = itemElem;
      curItemElem = itemElem;
      curSource = source;
      startSourceElem = sourceElem;
      curSourceElem = sourceElem;

      dragStarted = false;
      startIdx = idx();

      curIdx = idx;
      curClickProps = clickProps;

      updateItemElemPosition();
      addListeners();
      setMouseDown(item as any); // solid setters don't work well with generics
    },
    continueDrag: (item, idx, itemElem, source, sourceElem, clickProps) => {},
  };
}

interface SortableContextValue<T> {
  readonly addSortable: (sortable: SortableRef<T>) => void;
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
    addSortable: (ref: SortableRef<T>) => {
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
  readonly isMouseDown: Accessor<boolean>;
  readonly itemRef: (el: HTMLElement) => void;
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
  readonly checkIndex?: (rect: Rect) => CheckResult | undefined;
}
interface Layouter {
  readonly mount?: (elem: HTMLDivElement) => void;
  readonly unmount?: () => void;
  readonly layout: (sizes: ReadonlyArray<Size>) => Layout;
}

interface SortableProps<T, U extends JSX.Element>
  extends SortableHooks<T>,
    ClickProps {
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

  createEffect(() => {
    const layouter = props.layout;
    layouter.mount?.(containerRef!);
    onCleanup(() => layouter.unmount?.());
  });

  const itemToElem = new Map<T, HTMLElement>();
  // TODO: set custom equals method so this doesn't trigger unnecessary layout calls
  const [itemElems, setItemElems] = createSignal<ReadonlyArray<HTMLElement>>(
    []
  );
  const layout = createMemo(() =>
    props.layout.layout(itemElems().map(elemClientRect))
  );
  function updateItemElems() {
    // fast check to eliminate unnecessary array operations
    if (props.each.length != itemToElem.size) return;
    const tmpItemElems = props.each.map((item) => itemToElem.get(item));
    if (tmpItemElems.every((e) => e != null)) {
      setItemElems(tmpItemElems as HTMLElement[]);
    }
  }
  createEffect(on(() => props.each, updateItemElems, { defer: true }));

  const dragHandler: DragHandler<T> =
    sortableContext != null ? sortableContext.dragHandler : createDragHandler();

  onMount(() => {
    sortableRef = {
      ref: containerRef!,
      checkIndex: (rect) => layout().checkIndex?.(rect),
      hooks: createSortableHooksDispatcher(props),
    };
    if (sortableContext != null) {
      sortableContext.addSortable(sortableRef);
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
          let shouldInitPosition = true;

          const isMouseDown = createMemo(
            on(
              dragHandler.mouseDown,
              (dragging) => dragging != null && item === dragging
            )
          );

          onMount(() => {
            const sortable = sortableRef!;
            const containerElem = containerRef!;
            const itemElem = itemRef!;
            const handleElem = handleRef == null ? itemElem : handleRef;

            // manage html element map used for layouting
            itemToElem.set(item, itemElem);
            updateItemElems();
            onCleanup(() => {
              itemToElem.delete(item);
              updateItemElems();
            });

            // reactivley calc position and apply animation effect
            let anim: Animation | undefined;
            const pos = createMemo(() => layout().pos(idx()));
            createEffect(() => {
              if (!isMouseDown() && !isNaN(pos().x) && !isNaN(pos().y)) {
                const transform = `translate(${pos().x}px, ${pos().y}px)`;
                if (shouldInitPosition) {
                  // don't use animation when setting initial position
                  itemElem.style.transform = transform;
                  shouldInitPosition = false;
                } else {
                  itemElem.classList.add("released");
                  anim = itemElem.animate(
                    {
                      transform: transform,
                    },
                    {
                      duration: props.animDurationMs ?? 250,
                      easing: props.animEasing ?? "ease",
                      fill: "forwards",
                    }
                  );
                  anim.onfinish = () => itemElem.classList.remove("released");
                }
              }
            });

            const clickProps = () => ({
              clickDurMs: props.clickDurMs,
              clickDistPx: props.clickDistPx,
            });

            if (item === dragHandler.mouseDown()) {
              dragHandler.continueDrag(
                item,
                idx,
                itemElem,
                sortable,
                containerElem,
                clickProps
              );
            }
            const mouseDownListener = (e: MouseEvent) => {
              if (e.button != 0) return;
              dragHandler.startDrag(
                item,
                idx,
                itemElem,
                sortable,
                containerElem,
                e,
                clickProps
              );
              anim?.cancel();
            };

            handleElem.addEventListener("mousedown", mouseDownListener);
            onCleanup(() => {
              handleElem.removeEventListener("mousedown", mouseDownListener);
            });
          });

          return props.children({
            item,
            idx,
            isMouseDown,
            itemRef: (el) => (itemRef = el),
            handleRef: (el) => (handleRef = el),
          });
        }}
      </For>
    </div>
  );
}

function createRelayoutSignal(trackRelayout?: () => void) {
  const [relayout, setRelayout] = createSignal(1);
  createEffect(() => {
    trackRelayout?.();
    // delay layout until after reactions are finished
    queueMicrotask(() => setRelayout(-relayout()));
  });
  return relayout;
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
    return Math.floor(mod(boundingWidth, itemWidth) / 2);
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
      x: margin + itemWidth * mod(index, perRow),
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
  const relayout = createRelayoutSignal(trackRelayout);

  return {
    mount: (elem) => {
      container = elem;
      observer = new ResizeObserver(() => {
        setWidth(elemClientRect(elem).width);
      });
      setWidth(elemClientRect(elem).width);
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
          if (!intersects(elemPageRect(container!), rect)) return undefined;
          const calc = calcIndex(
            rect.x,
            rect.y,
            margin,
            width(),
            height,
            itemWidth,
            itemHeight
          );
          if (calc == null) return undefined;

          const idx = Math.max(0, Math.min(sizes.length, calc));
          if (idx == sizes.length) return { kind: "end", idx };
          else return { kind: "inside", idx };
        },
      };
    },
  };
}

type HorizontalAlignment = "left" | "center" | "right";

export function horizontalLayout(
  align: HorizontalAlignment = "left",
  stretch: boolean = false,
  trackRelayout?: () => void
): Layouter {
  const relayout = createRelayoutSignal(trackRelayout);

  return {
    layout: (sizes) => {
      relayout();

      const positions = [{ x: 0, y: 0 }];

      return {
        height: "",
        width: "",
        pos: (idx) => ({ x: 0, y: 0 }),
        checkIndex: () => undefined,
      };
    },
  };
}
