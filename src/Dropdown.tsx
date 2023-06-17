import { ParentComponent, Show, createEffect, onCleanup } from "solid-js";
import { filterEventsFrom, onEscapeKey } from "./utils/assorted";

interface DropdownProps {
  readonly show?: boolean;
  readonly onClose: () => void;
  readonly justify?: "right" | "left";
  readonly eventFIlterSources?: any[];
}

export const Dropdown: ParentComponent<DropdownProps> = (props) => {
  const mouseDownListener = filterEventsFrom(
    props.eventFIlterSources ?? [],
    () => props.onClose()
  );
  const keydownListener = filterEventsFrom(
    props.eventFIlterSources ?? [],
    onEscapeKey(() => props.onClose())
  );
  createEffect(() => {
    if (props.show) {
      setTimeout(() => {
        window.addEventListener("mousedown", mouseDownListener);
        window.addEventListener("keydown", keydownListener);
      });
    }
    onCleanup(() => {
      window.removeEventListener("mousedown", mouseDownListener);
      window.removeEventListener("keydown", keydownListener);
    });
  });
  return (
    <div
      class={`dropdown ${props.justify ?? "right"} ${
        props.show == null ? "" : props.show ? "show" : "hide"
      }`}
    >
      {props.children}
    </div>
  );
};
