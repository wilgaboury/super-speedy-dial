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

interface DragContextValue<T> {
  readonly mountDroppable: (droppable: DroppableRef) => void;
  readonly cleanupDroppable: (droppable: DroppableRef) => void;
}

type DragContext<T> = Context<DragContextValue<T>>;

function createDragContext<T>(): DragContext<T> {
  return createContext<DragContextValue<T>>({} as DragContextValue<T>);
}

function createDragContextValue<T>(): DragContextValue<T> {
  const droppables = new Set<DroppableRef>();
  return {
    mountDroppable: (ref: DroppableRef) => {
      droppables.add(ref);
    },
    cleanupDroppable: (ref: DroppableRef) => {
      droppables.delete(ref);
    },
  };
}

interface DraggableProps<T> {
  readonly item: T;
  readonly idx: Accessor<number>;
  readonly containerRef: (el: HTMLElement) => void;
  readonly handleRef: (el: HTMLElement) => void;
}

type DraggableContext<T> = Context<DraggableProps<T>>;

function createDraggableContext<T>(): DraggableContext<T> {
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
type LayoutGenerator = (
  elem: HTMLDivElement,
  sizes: ReadonlyArray<Size>
) => Layout;

function getElemDim(elem: HTMLElement): Size {
  return {
    width: elem.offsetWidth,
    height: elem.offsetHeight,
  };
}

interface DroppableProps<T, U extends JSX.Element> {
  readonly each: ReadonlyArray<T>;
  readonly generateLayout: LayoutGenerator;
  readonly getItemDim?: (elem: HTMLElement, item: T) => Size;
  readonly dragContextType?: DragContext<T>;
  readonly children: (props: DraggableProps<T>) => U;
}

function Droppable<T, U extends JSX.Element>(props: DroppableProps<T, U>) {
  const dragContext =
    props.dragContextType && useContext(props.dragContextType);
  let ref: HTMLDivElement | undefined;

  let droppableContextData: DroppableRef | undefined;
  onMount(() => {
    droppableContextData = {
      ref: ref!,
    };
    if (dragContext != null) {
      dragContext.mountDroppable(droppableContextData);
    }
  });
  onCleanup(() => {
    if (dragContext != null) {
      dragContext.cleanupDroppable(droppableContextData!);
    }
  });

  const itemToContainer = new Map<T, Size>();
  const [sizes, setSizes] = createSignal<ReadonlyArray<Size>>([]);
  const layout = createMemo(() => props.generateLayout(ref!, sizes()));

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

  return (
    <div ref={ref}>
      <For each={props.each}>
        {(item, idx) => {
          let containerRef: HTMLElement | undefined;
          let handleRef: HTMLElement | undefined;

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

            const [selected, setSelected] = createSignal(false); // TODO: change how this works to use drag context

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
          });

          return props.children({
            item,
            idx,
            containerRef: (el) => (containerRef = el),
            handleRef: (el) => (handleRef = el),
          });
        }}
      </For>
    </div>
  );
}
