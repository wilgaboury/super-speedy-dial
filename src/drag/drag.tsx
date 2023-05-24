import {
  Accessor,
  Component,
  Context,
  For,
  createContext,
  createEffect,
  createMemo,
  onMount,
  untrack,
  useContext,
} from "solid-js";
import { Dynamic } from "solid-js/web";

interface DragContextData<T> {
  readonly data: Accessor<T | undefined>;
  readonly setData: (data: T | undefined) => void;
  readonly ref: Accessor<HTMLElement | undefined>;
  readonly setRef: (ref: HTMLElement | undefined) => void;
}

const defaultDragContextData: DragContextData<any> = {
  data: () => undefined,
  setData: () => {},
  ref: () => undefined,
  setRef: () => {},
};

type DragContext<T> = Context<DragContextData<T>>;

function createDragContext<T>(): DragContext<T> {
  return createContext<DragContextData<T>>(defaultDragContextData);
}

interface DraggableContextData<T> {
  readonly item: T;
  readonly idx: Accessor<number>;
  readonly containerRef: (el: HTMLElement) => void;
  readonly handleRef: (el: HTMLElement) => void;
}

type DraggableContext<T> = Context<DraggableContextData<T>>;

function createDraggableContext<T>(): DraggableContext<T> {
  return createContext<DraggableContextData<T>>(
    {} as DraggableContextData<T> /* this is purposley wrong */
  );
}

interface DraggableProps<T> {}

function createDraggable<T>(
  context: DragContext<T>
): Component<DraggableProps<T>> {
  return (props) => {
    const contextData = useContext(context);

    return <></>;
  };
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

type Layout = (idx: number) => Position;

interface DroppableProps<T> {
  readonly layout: Layout;
  readonly each: ReadonlyArray<T>;
}

function createDroppable<T>(
  context: DragContext<T>,
  draggableContext: DraggableContext<T>,
  component: Component
): Component<DroppableProps<T>> {
  return (props) => {
    const contextData = useContext(context);

    return (
      <For each={props.each}>
        {(item, idx) => {
          let containerRef: HTMLElement | undefined;
          let handleRef: HTMLElement | undefined;

          onMount(() => {
            const container = containerRef!;
            const handle = handleRef == null ? container : handleRef;

            const initPos = untrack(() => props.layout(idx()));
            container.style.transform = `translate(${initPos.x}px, ${initPos.y}px)`;

            // if any calc position and reactivley apply animation effect
            let anim: Animation | undefined;
            const pos = createMemo(() => props.layout(idx()));
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

          return (
            <draggableContext.Provider
              value={{
                item,
                idx,
                containerRef: (el) => (containerRef = el),
                handleRef: (el) => (handleRef = el),
              }}
            >
              <Dynamic component={component} />
            </draggableContext.Provider>
          );
        }}
      </For>
    );
  };
}
