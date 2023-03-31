import {
  Accessor,
  Component,
  JSX,
  ParentComponent,
  Setter,
  Show,
  createSignal,
} from "solid-js";

type ShowState = "show" | "hiding" | "hide";

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
      setShow("show");
    },
    close: () => {
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

export const ModalContent: ParentComponent = (props) => {
  return <div class="modal-content">{props.children}</div>;
};

export const ModalSeparator: Component = () => {
  return <div class="modal-separator" />;
};

export const ModalButtons: ParentComponent = (props) => {
  return <div class="modal-buttons">{props.children}</div>;
};
