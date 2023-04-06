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
  readonly onClick?: (e: MouseEvent) => void;
}

export const ctxMenuIconSize = "20px";

export const ContextMenuItem: Component<ContentMenuItemProps> = (props) => {
  return (
    <div class="context-menu-item" onClick={props.onClick}>
      {props.icon}
      <div style={{ "margin-right": "10px" }} />
      {props.children}
    </div>
  );
};

export const ContextMenuSeparator: Component = () => {
  return (
    <div style={{ "border-bottom": "solid 1px gray", margin: "5px 10px" }} />
  );
};

type ShowClass = "" | "show" | "hide";

export interface ContextMenuState {
  readonly show: Accessor<ShowClass>;
  readonly setShow: Setter<ShowClass>;
  readonly x: Accessor<number>;
  readonly y: Accessor<number>;
  readonly transformOrigin: Accessor<string>;
  readonly content: Accessor<JSX.Element>;
  readonly open: (e: MouseEvent, content?: JSXElement) => void;
  readonly close: () => void;
}

const ContextMenuState = (): ContextMenuState => {
  const [show, setShow] = createSignal<ShowClass>("");
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
      e.stopImmediatePropagation();

      setShow("");
      setContent(content);

      const contextMenu = document.getElementById("context-menu")!;

      const docRect = document.documentElement.getBoundingClientRect();

      let x = e.pageX;
      let y = e.pageY;

      let transformX = "left";
      let transformY = "top";

      if (x + contextMenu.clientWidth > window.innerWidth - docRect.left) {
        x -= contextMenu.clientWidth;
        transformX = "right";
      }

      if (y + contextMenu.clientHeight > window.innerHeight - docRect.top) {
        y -= contextMenu.clientHeight;
        transformY = "bottom";
      }

      setTransformOrigin(transformY + " " + transformX);
      setX(x);
      setY(y);

      setShow("show");
    },
    close: () => {
      setShow("hide");
    },
  };
};

export const contextMenuState = ContextMenuState();

export const ContextMenu: Component = () => {
  document.addEventListener("mousedown", (e) => {
    if (e.button == 2) {
      contextMenuState.setShow("");
    } else {
      contextMenuState.close();
    }
  });
  document.addEventListener("scroll", () => contextMenuState.close());
  document.addEventListener("contextmenu", (e) => {
    if (contextMenuState.show()) {
      contextMenuState.setShow("");
    }
  });
  window.addEventListener("resize", () => contextMenuState.close());

  return (
    <div
      id="context-menu"
      class={contextMenuState.show()}
      style={`
        top: ${contextMenuState.y()}px;
        left: ${contextMenuState.x()}px;
        transform-origin: ${contextMenuState.transformOrigin()};
      `}
      onmousedown={(e) => e.stopImmediatePropagation()}
      onmouseup={() => contextMenuState.close()}
    >
      {contextMenuState.content()}
    </div>
  );
};
