import { Accessor, JSX, createContext, splitProps, useContext } from "solid-js";
import { applyFilter, enterKeyFilter } from "./utils/filter";

interface SegmentedContext<T> {
  readonly choice?: Accessor<T>;
  readonly onChoice?: (key: T) => void;
}

interface SegmentProps<T> extends JSX.HTMLAttributes<HTMLDivElement> {
  readonly key: T;
  readonly children: JSX.Element;
}

interface SegmentedControlPropsLocal<T> {
  readonly choice: T;
  readonly onChoice: (key: T) => void;
  readonly children: JSX.Element;
}

type ControlProps<T> = SegmentedControlPropsLocal<T> &
  JSX.HTMLAttributes<HTMLDivElement>;

export function createSegmented<T>() {
  const Context = createContext<SegmentedContext<T>>({});

  return {
    Control(props: ControlProps<T>) {
      const [segmented, children, rest] = splitProps(
        props,
        ["choice", "onChoice"],
        ["children"]
      );

      return (
        <Context.Provider
          value={{ choice: () => props.choice, onChoice: props.onChoice }}
        >
          <div {...rest} class="segmented-control">
            {children.children}
          </div>
        </Context.Provider>
      );
    },
    Segment: (props: SegmentProps<T>) => {
      const context = useContext(Context);
      const [local, rest] = splitProps(props, ["children"]);
      return (
        <div
          {...rest}
          tabIndex={0}
          class={`segmented-segment hide-focus ${
            context.choice?.() === props.key ? "selected" : ""
          }`}
          onClick={() => context.onChoice?.(props.key)}
          onKeyDown={applyFilter(enterKeyFilter)(() =>
            context.onChoice?.(props.key)
          )}
        >
          {local.children}
        </div>
      );
    },
  };
}
