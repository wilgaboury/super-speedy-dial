import {
  Accessor,
  ParentComponent,
  Show,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
} from "solid-js";
import { Portal } from "solid-js/web";
import { applyFilter, escapeKeyFilter } from "./utils/filter";

export interface ModalProps {
  readonly show: boolean;
  readonly onClose?: () => void;
  readonly closeOnBackgruondClick?: boolean;
}

const [allModalShows, setAllModalShows] = createSignal<Accessor<boolean>[]>([]);

export const isModalShowing = createMemo(() =>
  allModalShows()
    .map((v) => v())
    .reduce((v1, v2) => v1 || v2, false)
);

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

  onMount(() => {
    const show = () => props.show;
    setAllModalShows((shows) => [show, ...shows]);
    onCleanup(() =>
      setAllModalShows((shows) => {
        shows.splice(shows.indexOf(show), 1);
        return [...shows];
      })
    );
  });

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
