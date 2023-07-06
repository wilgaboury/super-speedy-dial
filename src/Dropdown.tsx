import { ParentComponent, createEffect, onCleanup } from "solid-js";
import { Filter, applyFilter, escapeKeyFilter } from "./utils/filter";

interface DropdownProps {
  readonly show?: boolean;
  readonly onClose: () => void;
  readonly justify?: "right" | "left";
  readonly mouseDownEventFilter?: Filter<MouseEvent>;
}

export const Dropdown: ParentComponent<DropdownProps> = (props) => {
  const mouseDownListener = applyFilter(props.mouseDownEventFilter)(() =>
    props.onClose()
  );
  const keydownListener = applyFilter(escapeKeyFilter)(() => props.onClose());
  createEffect(() => {
    if (props.show) {
      // setTimeout(() => {
      window.addEventListener("mousedown", mouseDownListener);
      window.addEventListener("keydown", keydownListener);
      // });
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
