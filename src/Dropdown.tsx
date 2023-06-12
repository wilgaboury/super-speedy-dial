import { ParentComponent, Show, createEffect, onCleanup } from "solid-js";
import { onEscapeKey } from "./utils/assorted";

interface DropdownProps {
  readonly show?: boolean;
  readonly onClose: () => void;
  readonly justify?: "right" | "left";
}

export const Dropdown: ParentComponent<DropdownProps> = (props) => {
  const mouseDownListener = () => props.onClose();
  const keydownListener = onEscapeKey(() => props.onClose());
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
