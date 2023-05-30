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

type Layout = {
  readonly height: string;
  readonly width: string;
  readonly pos: (idx: number) => Position;
};
type Layouter = (sizes: ReadonlyArray<Size>) => Layout;
type LayouterFactory = (elem: HTMLDivElement) => Layouter;

function getElemDim(elem: HTMLElement): Size {
  return {
    width: elem.offsetWidth,
    height: elem.offsetHeight,
  };
}

interface DroppableProps<T, U extends JSX.Element> {
  readonly each: ReadonlyArray<T>;
  readonly layout: LayouterFactory;
  readonly getItemDim?: (elem: HTMLElement, item: T) => Size;
  readonly dragContextType?: DragContext<T>;
  readonly children: (props: DraggableProps<T>) => U;
}

export function Droppable<T, U extends JSX.Element>(
  props: DroppableProps<T, U>
) {
  const dragContext =
    props.dragContextType && useContext(props.dragContextType);

  let ref: HTMLDivElement | undefined;
  let layouter: Layouter | undefined;
  let droppableContextData: DroppableRef | undefined;
  onMount(() => {
    layouter = props.layout(ref!);

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

  const itemToContainer = new Map<T, Size>();
  const [sizes, setSizes] = createSignal<ReadonlyArray<Size>>([]);
  const layout = createMemo(() => layouter!(sizes()));

  function updateSizes() {
    const each = untrack(() => props.each);
    if (each.length == itemToContainer.size) {
      setSizes(
        each.map((item) => {
          const value = itemToContainer.get(item);
          if (value == null)
            throw new Error("item size map out of sync with items");
          return value;
        })
      );
    }
  }

  createEffect(on(() => props.each, updateSizes, { defer: true }));

  const [dragging, setDragging] =
    dragContext != null
      ? [dragContext.dragging, dragContext.setDragging]
      : createSignal<Dragging<T>>();

  return (
    <div ref={ref}>
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

            createEffect(() => {
              // allows user variables affecting item size to be tracked for relayout
              const getItemDim =
                props.getItemDim != null ? props.getItemDim : getElemDim;
              itemToContainer.set(item, getItemDim(container, item));
              updateSizes();
              onCleanup(() => itemToContainer.delete(item));
            });

            const initPos = untrack(() => layout().pos(idx()));
            container.style.transform = `translate(${initPos.x}px, ${initPos.y}px)`;

            // if any calc position and reactivley apply animation effect
            let anim: Animation | undefined;
            const pos = createMemo(() => layout().pos(idx()));
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

export function flowGridLayout(elem: HTMLElement): Layouter {
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

  const [width, setWidth] = createSignal(elem.getBoundingClientRect().width);
  const observer = new ResizeObserver(() =>
    setWidth(elem.getBoundingClientRect().width)
  );

  return (sizes) => {
    const first = sizes.length > 0 ? sizes[0] : null;
    const itemWidth = createMemo(() => (first != null ? first.width : 0));
    const itemHeight = createMemo(() => (first != null ? first.height : 0));
    const height = createMemo(() =>
      calcHeight(sizes.length, width(), itemWidth(), itemHeight())
    );
    const margin = createMemo(() => calcMargin(width(), itemWidth()));

    return {
      width: "100%",
      height: `${height()}px`,
      pos: (idx) =>
        calcPosition(idx, margin(), width(), itemWidth(), itemHeight()),
    };
  };
}
