import {
  ParentComponent,
  Show,
  createEffect,
  createSignal,
  on,
  onCleanup,
} from "solid-js";
import { Portal } from "solid-js/web";
import { applyFilter, escapeKeyFilter } from "./utils/eventfilter";

let allowCount = 0;
export function setAllowScroll(scroll: boolean) {
  if (scroll) {
    allowCount--;
    if (allowCount == 0) document.documentElement.style.overflow = "overlay";
  } else {
    document.documentElement.style.overflow = "hidden";
    allowCount++;
  }
}

export interface ModalProps {
  readonly show: boolean;
  readonly onClose?: () => void;
  readonly closeOnBackgruondClick?: boolean;
}

export const Modal: ParentComponent<ModalProps> = (props) => {
  const [lagging, setLagging] = createSignal(props.show);

  const keyDownListener = applyFilter(escapeKeyFilter)(() => props.onClose?.());
  createEffect(() => {
    if (props.show) {
      setTimeout(() => {
        window.addEventListener("keydown", keyDownListener);
      });
    }
    onCleanup(() => {
      window.removeEventListener("keydown", keyDownListener);
    });
  });

  if (props.show) {
    setAllowScroll(!props.show);
  }
  createEffect(
    on(
      () => props.show,
      (show) => setAllowScroll(!show),
      { defer: true }
    )
  );

  const [mousedDown, setMousedDown] = createSignal(false);

  return (
    <Show when={props.show || lagging()}>
      <Portal mount={document.getElementById("modal")!}>
        <div
          class={`modal-background ${props.show ? "show" : "hide"}`}
          onMouseDown={() => setMousedDown(true)}
          onClick={(e) => {
            e.stopImmediatePropagation();
            if (mousedDown() && props.closeOnBackgruondClick) props.onClose?.();
            setMousedDown(false);
          }}
          onMouseLeave={() => setMousedDown(false)}
          onAnimationEnd={() => setLagging(props.show)}
        >
          <div class="modal-center-container">
            <div class="modal-padding-container">
              <div class="modal">{props.children}</div>
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  );
};
