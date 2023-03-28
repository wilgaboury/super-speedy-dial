import {
  Accessor,
  Component,
  createSignal,
  JSX,
  JSXElement,
  Setter,
} from "solid-js";

export interface ContentMenuItemProps {
  readonly icon?: JSX.Element;
  readonly children: JSX.Element;
  readonly onClick?: (e: MouseEvent) => {};
}

export const ContextMenuItem: Component<ContentMenuItemProps> = (props) => {
  return (
    <div class="context-menu-item" onClick={props.onClick}>
      {props.children}
    </div>
  );
};

export const ContextMenuSeparator: Component = () => {
  return <></>;
};

export interface ContextMenuState {
  readonly show: Accessor<boolean>;
  readonly setShow: Setter<boolean>;
  readonly x: Accessor<number>;
  readonly y: Accessor<number>;
  readonly content: Accessor<JSX.Element>;
  readonly open: (e: MouseEvent, content?: JSXElement) => void;
  readonly close: () => void;
}

const ContextMenuState = (): ContextMenuState => {
  const [show, setShow] = createSignal(false);
  const [x, setX] = createSignal(0);
  const [y, setY] = createSignal(0);
  const [content, setContent] = createSignal(<></>);

  return {
    show,
    setShow,
    x,
    y,
    content,
    open: (e: MouseEvent, content: JSX.Element = <></>) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      setX(e.pageX);
      setY(e.pageY);
      setContent(content);
      setShow(true);
    },
    close: () => {
      setShow(false);
    },
  };
};

export const contextMenuState = ContextMenuState();

export const ContextMenu: Component = () => {
  document.addEventListener("click", () => contextMenuState.close());
  document.addEventListener("contextmenu", (e) => {
    if (contextMenuState.show()) {
      contextMenuState.close();
    }
  });
  return (
    <div
      class={`context-menu${contextMenuState.show() ? " visible" : ""}`}
      style={{
        top: `${contextMenuState.y()}px`,
        left: `${contextMenuState.x()}px`,
      }}
    >
      {contextMenuState.content}
    </div>
  );
};
