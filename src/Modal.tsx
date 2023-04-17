import {
  ParentComponent,
  Show,
  createEffect,
  createSignal,
  on,
} from "solid-js";
import { Portal } from "solid-js/web";

export function setAllowScroll(scroll: boolean) {
  if (scroll) document.documentElement.style.overflow = "auto";
  else document.documentElement.style.overflow = "hidden";
}

let numModals = 0;

export interface ModalProps {
  readonly show: boolean;
  readonly onBackgroundClick?: () => void;
}

export const Modal: ParentComponent<ModalProps> = (props) => {
  const [lagging, setLagging] = createSignal(props.show);

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
            if (mousedDown() && props.onBackgroundClick != null)
              props.onBackgroundClick();
            setMousedDown(false);
          }}
          onMouseLeave={() => setMousedDown(false)}
          onAnimationEnd={() => setLagging(props.show)}
        >
          <div class="modal">{props.children}</div>
        </div>
      </Portal>
    </Show>
  );
};
