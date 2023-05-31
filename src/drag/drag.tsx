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

interface DroppableRef {
  readonly ref: HTMLDivElement;
}

interface Dragging<T> {
  readonly item: T;
  readonly ref: HTMLElement;
  readonly downPos: Position;
  readonly cleanup: () => void;
}

interface DragContextValue<T> {
  readonly mountDroppable: (droppable: DroppableRef) => void;
  readonly cleanupDroppable: (droppable: DroppableRef) => void;
  readonly dragging: Accessor<Dragging<T> | undefined>;
  readonly setDragging: (dragging: Dragging<T> | undefined) => void;
}

type DragContext<T> = Context<DragContextValue<T>>;

export function createDragContext<T>(): DragContext<T> {
  return createContext<DragContextValue<T>>({} as DragContextValue<T>);
}

export function createDragContextValue<T>(): DragContextValue<T> {
  const droppables = new Set<DroppableRef>();
  const [dragging, setDragging] = createSignal<Dragging<T>>();

  createEffect(
    on(dragging, (_, draggingPrev) => {
      if (draggingPrev != null) draggingPrev.cleanup();
    })
  );

  return {
    mountDroppable: (ref: DroppableRef) => {
      droppables.add(ref);
    },
    cleanupDroppable: (ref: DroppableRef) => {
      droppables.delete(ref);
    },
    dragging,
    setDragging,
  };
}

interface DraggableProps<T> {
  readonly item: T;
  readonly idx: Accessor<number>;
  readonly selected: Accessor<boolean>;
  readonly containerRef: (el: HTMLElement) => void;
  readonly handleRef: (el: HTMLElement) => void;
}

type DraggableContext<T> = Context<DraggableProps<T>>;

export function createDraggableContext<T>(): DraggableContext<T> {
  return createContext<DraggableProps<T>>({} as DraggableProps<T>);
}

interface Position {
  readonly x: number;
  readonly y: number;
}

interface Size {
  readonly width: number;
  readonly height: number;
}

interface Rect {
  readonly pos: Position;
  readonly size: Size;
}

interface Layout {
  readonly height: string;
  readonly width: string;
  readonly pos: (idx: number) => Position;
  readonly calcIndex?: (rect: Rect) => number | null;
}
interface Layouter {
  readonly mount?: (elem: HTMLDivElement) => void;
  readonly unmount?: () => void;
  readonly layout: (sizes: ReadonlyArray<Size>) => Layout;
}

export function getElemDim(elem: HTMLElement): Size {
  return {
    width: elem.offsetWidth,
    height: elem.offsetHeight,
  };
}

interface DroppableProps<T, U extends JSX.Element> {
  readonly each: ReadonlyArray<T>;
  readonly layout: Layouter;
  readonly dragContextType?: DragContext<T>;
  readonly children: (props: DraggableProps<T>) => U;

  // TODO: implement and use callbacks
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

export function Droppable<T, U extends JSX.Element>(
  props: DroppableProps<T, U>
) {
  const dragContext =
    props.dragContextType && useContext(props.dragContextType);

  let ref: HTMLDivElement | undefined;
  let droppableContextData: DroppableRef | undefined;

  createEffect(
    on(
      () => props.layout,
      (layouter, prevLayouter) => {
        layouter.mount?.(ref!);
        onCleanup(() => prevLayouter?.unmount?.());
      }
    )
  );

  onMount(() => {
    droppableContextData = {
      ref: ref!,
    };
    if (dragContext != null) {
      dragContext.mountDroppable(droppableContextData);
    }
    onCleanup(() => {
      if (dragContext != null) {
        dragContext.cleanupDroppable(droppableContextData!);
      }
    });
  });

  const itemToContainer = new Map<T, HTMLElement>();
  const [containers, setContainers] = createSignal<ReadonlyArray<HTMLElement>>(
    []
  );
  const layouter = createMemo(() => props.layout);
  const layout = createMemo(() =>
    layouter().layout(containers().map(getElemDim))
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

  const [dragging, setDragging] =
    dragContext != null
      ? [dragContext.dragging, dragContext.setDragging]
      : createSignal<Dragging<T>>();

  return (
    <div ref={ref} style={{ width: layout().width, height: layout().height }}>
      <For each={props.each}>
        {(item, idx) => {
          let containerRef: HTMLElement | undefined;
          let handleRef: HTMLElement | undefined;

          const selected = createMemo(
            on(dragging, (d) => d != null && d.item == item)
          );

          onMount(() => {
            const container = containerRef!;
            const handle = handleRef == null ? container : handleRef;

            itemToContainer.set(item, container);
            updateContainers();
            onCleanup(() => itemToContainer.delete(item));

            // if any calc position and reactivley apply animation effect
            let anim: Animation | undefined;
            const pos = createMemo(() => layout().pos(idx()));
            createEffect(() => {
              if (!selected() && !isNaN(pos().x) && !isNaN(pos().y)) {
                if (!container.style.transform) {
                  // don't use animation when setting initial position
                  const transform = `translate(${pos().x}px, ${pos().y}px)`;
                  container.style.transform = transform;
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
              }
            });

            handle.addEventListener("mousedown", (e) => {
              if (e.button != 0) return;

              const containerRect = container.getBoundingClientRect();

              // track mousedown initial position and time
              const mouseDownTime = Date.now();
              const mouseDownX = e.clientX - containerRect.left;
              const mouseDownY = e.clientY - containerRect.top;
            });
          });

          return props.children({
            item,
            idx,
            selected: selected,
            containerRef: (el) => (containerRef = el),
            handleRef: (el) => (handleRef = el),
          });
        }}
      </For>
    </div>
  );
}

// All the elements of this layout should be equally sized
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
  const [width, setWidth] = createSignal(0);

  return {
    mount: (elem) => {
      observer = new ResizeObserver(() => {
        setWidth(elem.getBoundingClientRect().width);
      });
      setWidth(elem.getBoundingClientRect().width);
      observer.observe(elem);
    },
    unmount: () => {
      observer?.disconnect();
    },

    layout: (sizes) => {
      trackRelayout?.();
      const first = sizes.length > 0 ? sizes[0] : null;
      const itemWidth = first != null ? first.width : 0;
      const itemHeight = first != null ? first.height : 0;
      const height = calcHeight(sizes.length, width(), itemWidth, itemHeight);
      const margin = calcMargin(width(), itemWidth);
      return {
        width: "100%",
        height: `${height}px`,
        pos: (idx) => calcPosition(idx, margin, width(), itemWidth, itemHeight),
        calcIndex: (rect: Rect) => {
          return calcIndex(
            rect.pos.x,
            rect.pos.y,
            margin,
            width(),
            height,
            itemWidth,
            itemHeight
          );
        },
      };
    },
  };
}
