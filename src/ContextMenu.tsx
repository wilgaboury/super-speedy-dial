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
  readonly transformOrigin: Accessor<String>;
  readonly content: Accessor<JSX.Element>;
  readonly open: (e: MouseEvent, content?: JSXElement) => void;
  readonly close: () => void;
}

const ContextMenuState = (): ContextMenuState => {
  const [show, setShow] = createSignal(false);
  const [x, setX] = createSignal(0);
  const [y, setY] = createSignal(0);
  const [content, setContent] = createSignal(<></>);
  const [transformOrigin, setTransformOrigin] = createSignal("");

  return {
    show,
    setShow,
    x,
    y,
    content,
    transformOrigin,
    open: (e: MouseEvent, content: JSX.Element = <></>) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      setShow(false);

      setContent(content);

      const contextMenu = document.getElementById("context-menu")!;

      const { width: boundsX, height: boundsY } =
        document.body.getBoundingClientRect();

      let x = e.pageX;
      let y = e.pageY;

      let transformX = "left";
      let transformY = "top";

      if (e.clientX + contextMenu.clientWidth > boundsX) {
        x -= contextMenu.clientWidth;
        transformX = "right";
      }

      if (e.clientY + contextMenu.clientHeight > boundsY) {
        y -= contextMenu.clientHeight;
        transformY = "bottom";
      }

      setTransformOrigin(transformY + " " + transformX);
      setX(x);
      setY(y);

      setShow(true);
    },
    close: () => setShow(false),
  };
};

export const contextMenuState = ContextMenuState();

export const ContextMenu: Component = () => {
  document.addEventListener("mousedown", () => contextMenuState.close());
  document
    .getElementById("root")!
    .addEventListener("scroll", () => contextMenuState.close());
  document.addEventListener("contextmenu", (e) => {
    if (contextMenuState.show()) {
      contextMenuState.close();
    }
  });
  window.addEventListener("resize", () => contextMenuState.close());

  return (
    <div
      id="context-menu"
      class={`${contextMenuState.show() ? "visible" : ""}`}
      style={`
        top: ${contextMenuState.y()}px;
        left: ${contextMenuState.x()}px;
        transform-origin: ${contextMenuState.transformOrigin()};
      `}
    >
      {contextMenuState.content}
    </div>
  );
};
