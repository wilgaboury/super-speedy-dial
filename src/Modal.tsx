import {
  ParentComponent,
  Show,
  createEffect,
  createSignal,
  on,
} from "solid-js";
import { Portal } from "solid-js/web";

export function setAllowScroll(scroll: boolean) {
  if (scroll) document.documentElement.style.overflow = "overlay";
  else document.documentElement.style.overflow = "hidden";
}

let numModals = 0;

export interface ModalProps {
  readonly show: boolean;
  readonly onClose: () => void;
  readonly closeOnBackgruondClick?: boolean;
}

export const Modal: ParentComponent<ModalProps> = (props) => {
  const [lagging, setLagging] = createSignal(props.show);

  document.addEventListener("keydown", (e) => {
    if (props.show && e.key == "Escape") props.onClose();
  });

  createEffect(
    on(
      () => props.show,
      (show, prevShow) => {
        if (prevShow != null && show != prevShow) {
          numModals += show ? 1 : -1;
        }
        setAllowScroll(numModals == 0);
      }
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
            if (mousedDown() && props.closeOnBackgruondClick) props.onClose();
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
