import {
  Accessor,
  Component,
  JSX,
  Setter,
  Show,
  createEffect,
  createSignal,
} from "solid-js";

type ShowState = "show" | "hiding" | "hide";

export const [allowScroll, setAllowScroll] = createSignal(true);

createEffect(() => {
  if (allowScroll()) document.documentElement.style.overflow = "unset";
  else document.documentElement.style.overflow = "hidden";
});

export interface ModalState {
  readonly show: Accessor<ShowState>;
  readonly setShow: Setter<ShowState>;
  readonly content: Accessor<JSX.Element>;
  readonly open: (content?: JSX.Element) => void;
  readonly close: () => void;
}

function ModalState(): ModalState {
  const [show, setShow] = createSignal<ShowState>("hide");
  const [content, setContent] = createSignal(<></>);
  return {
    show,
    setShow,
    content,
    open: (c) => {
      setContent(c);
      setAllowScroll(false);
      setShow("show");
    },
    close: () => {
      setAllowScroll(true);
      setShow("hiding");
    },
  };
}

export const modalState = ModalState();

export const ModalBackground: Component = (props) => {
  return (
    <Show when={modalState.show() != "hide"}>
      <div
        class={`modal-background ${
          modalState.show() == "show" ? "show" : "hide"
        }`}
        onclick={(e) => e.stopPropagation()}
        onanimationend={() => {
          if (modalState.show() == "hiding") {
            modalState.setShow("hide");
          }
        }}
      >
        <div class="modal">{modalState.content()}</div>
      </div>
    </Show>
  );
};
