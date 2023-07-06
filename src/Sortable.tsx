import {
  Accessor,
  Context,
  For,
  JSX,
  Show,
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
  area,
  clientToPage,
  clientToRelative,
  dist,
  elemClientRect,
  elemPageRect,
  intersection,
  intersects,
  pageToRelative,
  toSize,
} from "./utils/geom";
import { Size } from "./utils/image";
import {
  clamp,
  mapZeroOneToZeroInf,
  mod,
  normalize,
  zip,
} from "./utils/assorted";
import { Filter } from "./utils/filter";
import { style } from "solid-js/web";

interface SortableHooks<T> {
  readonly onClick?: (item: T, idx: number, e: MouseEvent) => void;
  readonly onDragStart?: (item: T, idx: number) => void;
  readonly onDragEnd?: (
    item: T,
    startIdx: number | undefined,
    endIdx: number | undefined
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
  readonly checkIndex?: (rect: Rect) => number | undefined;
  readonly hooks: SortableHooks<T>;
  readonly len: Accessor<number>;
  readonly insertFilter: Accessor<Filter<T>>;
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
    clickProps: Accessor<ClickProps>,
    autoscroll: Accessor<HTMLElement | undefined>
  ) => void;
  readonly continueDrag: (
    item: T,
    idx: Accessor<number>,
    itemElem: HTMLElement,
    source: SortableRef<T>,
    sourceElem: HTMLDivElement,
    clickProps: Accessor<ClickProps>,
    autoscroll: Accessor<HTMLElement | undefined>
  ) => void;
}

interface DragState<T> {
  item: T;
  itemElem: HTMLElement;
  startItemElem: HTMLElement;
  startSize: Size;
  source: SortableRef<T>;
  sourceElem: HTMLDivElement;
  startSource: SortableRef<T>;
  startSourceElem: HTMLDivElement;

  mouseDownTime: number;
  mouseMoveDist: number;
  mouseMove: Position; // client coords
  mouseMovePrev: Position; // page coords
  mouseDownPos: Position; // relative coords

  idx: Accessor<number>;
  startIdx: number;

  clickProps: Accessor<ClickProps>;

  autoscroll: Accessor<HTMLElement | undefined>;

  dragStarted: boolean;
  scrollIntervalId?: number;
}

function createDragHandler<T>(sortables?: Set<SortableRef<T>>): DragHandler<T> {
  const [mouseDown, setMouseDown] = createSignal<T>();

  let curState: DragState<T> | undefined;

  function updateMouseData(e: MouseEvent) {
    const state = curState!;
    state.mouseMove = { x: e.x, y: e.y };
    updateMouseMoveDist();
    state.mouseMovePrev = clientToPage(state.mouseMove);
  }

  function isClick() {
    const state = curState!;
    const elapsed = Date.now() - state.mouseDownTime;
    const tmpClickProps = state.clickProps();
    const clickDurMs = tmpClickProps.clickDurMs ?? 100;
    const clickDistPx = tmpClickProps.clickDistPx ?? 8;
    // TODO: also check and make sure index has not changed
    return elapsed < clickDurMs || state.mouseMoveDist < clickDistPx;
  }

  function updateMouseMoveDist() {
    const state = curState!;
    state.mouseMoveDist += dist(
      clientToPage(state.mouseMove),
      state.mouseMovePrev
    );
  }

  function updateItemElemPosition() {
    const state = curState!;
    if (state.itemElem != null && state.sourceElem != null) {
      const pos = clientToRelative(state.mouseMove, state.sourceElem);
      const x = pos.x - state.mouseDownPos.x;
      const y = pos.y - state.mouseDownPos.y;
      state.itemElem.style.transform = `translate(${x}px, ${y}px)`;
    }
  }

  function clearAutoscroll() {
    const state = curState!;
    if (state.scrollIntervalId != null) {
      clearInterval(state.scrollIntervalId);
      state.scrollIntervalId = undefined;
    }
  }

  function updateAutoscroll() {
    clearAutoscroll();

    const state = curState!;
    const elem = state.autoscroll();

    if (elem == null) return;

    const rect = intersection(elemClientRect(elem), {
      x: 0,
      y: 0,
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
    });

    if (rect == null) return;

    const scrollBy = { x: 0, y: 0 };
    const pos = state.mouseMove;
    const xStripWidth = Math.round((rect.width / 2) * 0.5);
    const yStripWidth = Math.round((rect.height / 2) * 0.5);

    const mult = 2.5;

    if (pos.x <= rect.x + xStripWidth) {
      const min = rect.x;
      const max = rect.x + xStripWidth;
      scrollBy.x = -Math.min(
        rect.width,
        1 + mult * mapZeroOneToZeroInf(1 - normalize(pos.x, min, max))
      );
    } else if (pos.x >= rect.x + rect.width - xStripWidth) {
      const min = rect.x + rect.width - xStripWidth;
      const max = rect.x + rect.width;
      scrollBy.x = Math.min(
        rect.width,
        1 + mult * mapZeroOneToZeroInf(normalize(pos.x, min, max))
      );
    }

    if (pos.y <= rect.y + yStripWidth) {
      const min = rect.y;
      const max = rect.y + yStripWidth;
      scrollBy.y = -Math.min(
        rect.height,
        1 + mult * mapZeroOneToZeroInf(1 - normalize(pos.y, min, max))
      );
    } else if (pos.y >= rect.y + rect.height - yStripWidth) {
      const min = rect.y + rect.height - yStripWidth;
      const max = rect.y + rect.height;
      scrollBy.y = Math.min(
        rect.height,
        1 + mult * mapZeroOneToZeroInf(normalize(pos.y, min, max))
      );
    }

    if (scrollBy.x != 0 || scrollBy.y != 0) {
      state.scrollIntervalId = setInterval(
        () => elem.scrollBy(scrollBy.x, scrollBy.y),
        1
      );
    }
  }

  function maybeTriggerMove() {
    const state = curState!;
    const rect = elemPageRect(state.itemElem);

    if (intersects(rect, elemPageRect(state.sourceElem))) {
      const indexCheck = state.source?.checkIndex?.(rect);
      if (
        indexCheck != null &&
        state.idx() !== Math.min(state.source.len(), indexCheck)
      ) {
        state.source?.hooks?.onMove?.(state.item, state.idx(), indexCheck);
      }
      return;
    }

    // check and trigger move to another sortable
    if (sortables != null) {
      for (const sortable of sortables) {
        if (
          sortable === state.source ||
          !intersects(rect, elemPageRect(sortable.ref)) ||
          !sortable.insertFilter()(state.item)
        ) {
          continue;
        }

        const indexCheck = sortable.checkIndex?.(rect);
        if (indexCheck != null) {
          state.source?.hooks?.onRemove?.(state.item, state.idx());
          sortable?.hooks?.onInsert?.(state.item, indexCheck);
          return;
        }
      }
    }
  }

  const onMouseUp = (e: MouseEvent) => {
    clearAutoscroll();
    removeListeners();

    const state = curState!;

    if (e.button == 0 && isClick()) {
      // ensure errors from callback do not intefere with internal state
      try {
        state.source?.hooks?.onClick?.(state.item, state.idx(), e);
      } catch (err) {
        console.error(err);
      }
    } else if (state.startSource == state.source) {
      state.source?.hooks?.onDragEnd?.(state.item, state.startIdx, state.idx());
    } else {
      state.startSource?.hooks?.onDragEnd?.(
        state.item,
        state.startIdx,
        undefined
      );
      state.source?.hooks?.onDragEnd?.(state.item, undefined, state.idx());
    }
    setMouseDown(undefined);
  };

  const onMouseMove = (e: MouseEvent) => {
    const state = curState!;

    updateMouseData(e);
    updateItemElemPosition();
    updateAutoscroll();
    maybeTriggerMove();

    if (!isClick() && !state.dragStarted) {
      state.dragStarted = true;
      state.startSource?.hooks?.onDragStart?.(state.item, state.startIdx);
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
    startDrag: (
      item,
      idx,
      itemElem,
      source,
      sourceElem,
      e,
      clickProps,
      autoscroll
    ) => {
      const mouseMove = { x: e.x, y: e.y };

      curState = {
        mouseDownTime: Date.now(),
        mouseMoveDist: 0,
        mouseMove,
        mouseMovePrev: mouseMove,
        mouseDownPos: clientToRelative(mouseMove, itemElem),

        item,
        itemElem,
        startItemElem: itemElem,
        startSize: toSize(elemClientRect(itemElem)),
        source,
        sourceElem,
        startSource: source,
        startSourceElem: sourceElem,

        idx,
        startIdx: idx(),

        clickProps,
        autoscroll,

        dragStarted: false,
      };

      updateItemElemPosition();
      addListeners();
      setMouseDown(item as any); // solid setters don't work well with generics
    },
    continueDrag: (
      item,
      idx,
      itemElem,
      source,
      sourceElem,
      clickProps,
      autoscroll
    ) => {
      const state = curState!;
      state.item = item;
      state.idx = idx;
      state.itemElem = itemElem;
      state.source = source;
      state.sourceElem = sourceElem;
      state.clickProps = clickProps;
      state.autoscroll = autoscroll;

      const newSize = toSize(elemClientRect(itemElem));
      state.mouseDownPos = {
        x: state.mouseDownPos.x * (newSize.width / state.startSize.width),
        y: state.mouseDownPos.y * (newSize.height / state.startSize.height),
      };

      state.startSize = newSize;

      updateItemElemPosition();
    },
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
  readonly pos: (idx: number) => Position;
  readonly checkIndex?: (rect: Rect) => number | undefined; // rect page space
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
  readonly layout: Layouter | (() => Layouter);
  readonly children: (props: SortableItemProps<T>) => U;

  readonly fallback?: JSX.Element;

  readonly insertFilter?: Filter<T>;

  readonly autoscroll?: boolean | HTMLElement;
  readonly autoscrollBorderWidth?: number;

  readonly animDurationMs?: number;
  readonly animEasing?: string;
}

export function Sortable<T, U extends JSX.Element>(props: SortableProps<T, U>) {
  const sortableContext = props.context && useContext(props.context);

  let containerRef: HTMLDivElement | undefined;
  let sortableRef: SortableRef<T> | undefined;

  const layouter = createMemo(() =>
    typeof props.layout === "function" ? props.layout() : props.layout
  );

  createEffect(() => {
    const tmp = layouter();
    tmp.mount?.(containerRef!);
    onCleanup(() => tmp.unmount?.());
  });

  const itemToElem = new Map<T, HTMLElement>();
  // TODO: set custom equals method so this doesn't trigger unnecessary layout calls
  const [itemElems, setItemElems] = createSignal<ReadonlyArray<HTMLElement>>(
    []
  );
  const layout = createMemo(() =>
    layouter().layout(itemElems().map(elemClientRect).map(toSize))
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
      len: () => props.each.length,
      insertFilter: () => props.insertFilter ?? (() => true),
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
    <div class="sortable" ref={containerRef} style={{ position: "relative" }}>
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
            const autoscroll = createMemo(() =>
              props.autoscroll === true
                ? containerElem
                : props.autoscroll === false
                ? undefined
                : props.autoscroll
            );

            if (itemElem == null) {
              console.error("Sortable missing reference to children");
            }
            itemElem.style.visibility = "hidden";
            itemElem.style.position = "absolute";
            createEffect(() => {
              if (isMouseDown()) {
                itemElem.classList.add("sortable-mousedown");
              }
              onCleanup(() => itemElem.classList.remove("sortable-mousedown"));
            });

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
                  itemElem.style.visibility = "visible";
                  shouldInitPosition = false;
                } else {
                  itemElem.classList.add("sortable-animating");
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
                  anim.onfinish = () =>
                    itemElem.classList.remove("sortable-animating");
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
                clickProps,
                autoscroll
              );
              shouldInitPosition = false;
              itemElem.style.visibility = "visible";
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
                clickProps,
                autoscroll
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
      <Show when={props.each.length === 0}>{props.fallback}</Show>
    </div>
  );
}

function createRelayoutSignal(trackRelayout?: () => void) {
  const [depend, trigger] = createSignal(undefined, {
    equals: false,
  });
  createEffect(() => {
    trackRelayout?.();
    // delay layout until after reactions are finished
    queueMicrotask(() => trigger());
  });
  return depend;
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

      if (container != null) {
        container.style.width = "100%";
        container.style.height = "100%";
      }
    },
    unmount: () => {
      container = undefined;
      observer?.disconnect();
    },
    layout: (sizes) => {
      relayout();
      const itemWidth = Math.max(0, ...sizes.map((s) => s.width));
      const itemHeight = Math.max(0, ...sizes.map((s) => s.height));

      const minHeight = calcHeight(
        sizes.length,
        width(),
        itemWidth,
        itemHeight
      );
      const margin = calcMargin(width(), itemWidth);

      if (container != null) {
        if (sizes.length > 0) {
          container.style.minHeight = `${minHeight}px`;
        } else {
          container.style.minHeight = "";
        }
      }

      return {
        pos: (idx) => calcPosition(idx, margin, width(), itemWidth, itemHeight),
        checkIndex: (rect: Rect) => {
          if (sizes.length === 0) return 0;
          const relRect = pageToRelative(rect, container!);
          const height = Math.max(
            container != null ? elemClientRect(container).height : 0,
            minHeight
          );
          const calc = calcIndex(
            relRect.x,
            relRect.y,
            margin,
            width(),
            height,
            itemWidth,
            itemHeight
          );
          if (calc == null) return undefined;
          return clamp(calc, 0, sizes.length);
        },
      };
    },
  };
}

const HorizonalDirection = {
  primary: (size: Size) => size.width,
  secondary: (size: Size) => size.height,
  pos: (sum: number) => ({ x: sum, y: 0 }),
  apply: (container: HTMLElement, primary: number, secondary: number) => {
    container.style.width = primary === 0 ? "" : `${primary}px`;
    container.style.height = secondary === 0 ? "" : `${secondary}px`;
  },
};

const VerticalDirection = {
  primary: (size: Size) => size.height,
  secondary: (size: Size) => size.width,
  pos: (sum: number) => ({ x: 0, y: sum }),
  apply: (container: HTMLElement, primary: number, secondary: number) => {
    container.style.width = secondary === 0 ? "" : `${secondary}px`;
    container.style.height = primary === 0 ? "" : `${primary}px`;
  },
};

type LinearLayoutDirection =
  | typeof HorizonalDirection
  | typeof VerticalDirection;

function linearLayout(
  direction: LinearLayoutDirection,
  trackRelayout?: () => void
): Layouter {
  const relayout = createRelayoutSignal(trackRelayout);

  let container: HTMLElement | undefined;

  return {
    mount: (elem) => {
      container = elem;
    },
    unmount: () => {
      container = undefined;
    },
    layout: (sizes) => {
      relayout();

      const positions: Array<Position> = [];
      let sum = 0;
      for (const size of sizes) {
        positions.push(direction.pos(sum));
        sum += direction.primary(size);
      }

      const primary = sizes
        .map(direction.primary)
        .reduce((sum, value) => sum + value, 0);
      const secondary = Math.max(0, ...sizes.map(direction.secondary));

      const rects = zip(sizes, positions).map(([size, pos]) => ({
        ...size,
        ...pos,
      }));

      if (container != null) {
        direction.apply(container, primary, secondary);
      }

      return {
        pos: (idx) => positions[idx],
        checkIndex: (rect: Rect) => {
          if (sizes.length === 0) return 0;
          const relRect = pageToRelative(rect, container!);
          const rectArea = area(rect);
          for (const [idx, itemRect] of rects.entries()) {
            if (intersects(relRect, itemRect)) {
              const itemArea = area(itemRect);
              const intersectArea = area(intersection(relRect, itemRect)!);
              if (
                intersectArea >= itemArea / 2 ||
                intersectArea >= rectArea / 2
              ) {
                return idx;
              }
            }
          }
          return undefined;
        },
      };
    },
  };
}

export function horizontalLayout(trackRelayout?: () => void) {
  return linearLayout(HorizonalDirection, trackRelayout);
}

export function verticalLayout(trackRelayout?: () => void) {
  return linearLayout(VerticalDirection, trackRelayout);
}
