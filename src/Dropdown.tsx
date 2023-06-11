import {
  Component,
  ParentComponent,
  Show,
  createEffect,
  onCleanup,
  onMount,
} from "solid-js";

interface DropdownProps {
  readonly show: boolean;
  readonly onClose: () => void;
  readonly justify?: "right" | "left";
}

export const Dropdown: ParentComponent<DropdownProps> = (props) => {
  const clickListener = () => props.onClose();
  const keydownListener = (e: KeyboardEvent) => {
    if (e.key == "Escape") props.onClose();
  };
  createEffect(() => {
    if (props.show)
      setTimeout(() => {
        window.addEventListener("click", clickListener);
        window.addEventListener("keydown", keydownListener);
      });
    onCleanup(() => {
      window.removeEventListener("click", clickListener);
      window.removeEventListener("keydown", keydownListener);
    });
  });
  return (
    <Show when={props.show}>
      <div class={`dropdown ${props.justify ?? "right"}`}>{props.children}</div>
    </Show>
  );
};
