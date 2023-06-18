import {
  Component,
  createEffect,
  createSignal,
  JSX,
  on,
  onCleanup,
  onMount,
  ParentComponent,
} from "solid-js";
import { Portal } from "solid-js/web";
import {
  applyFilter,
  enterKeyFilter,
  escapeKeyFilter,
} from "./utils/eventfilter";

export interface ContentMenuItemProps {
  readonly icon?: JSX.Element;
  readonly children: JSX.Element;
  readonly onClick?: (e: MouseEvent) => void;
}

export const ctxMenuIconSize = "20px";

export const ContextMenuItem: Component<ContentMenuItemProps> = (props) => {
  return (
    <button
      onClick={props.onClick}
      onContextMenu={(e) => {
        e.preventDefault();
        if (props.onClick != null) props.onClick(e);
      }}
    >
      {props.icon}
      <div style={{ "margin-right": "10px" }} />
      {props.children}
    </button>
  );
};

export const ContextMenuSeparator: Component = () => {
  return <div class="separator" />;
};

type ShowClass = "" | "show" | "hide";

interface ContextMenuProps {
  readonly event?: MouseEvent;
}

export const ContextMenu: ParentComponent<ContextMenuProps> = (props) => {
  const [show, setShow] = createSignal<ShowClass>("");

  const [x, setX] = createSignal(0);
  const [y, setY] = createSignal(0);
  const [transformOrigin, setTransformOrigin] = createSignal("");

  let menuRef: HTMLDivElement | undefined;

  function setPosAnimData(event: MouseEvent) {
    const menu = menuRef!;

    const docRect = document.documentElement.getBoundingClientRect();

    let x = event.pageX;
    let y = event.pageY;

    let transformX = "left";
    let transformY = "top";

    if (x + menu.clientWidth > window.innerWidth - docRect.left) {
      x -= menu.clientWidth;
      transformX = "right";
    }

    if (y + menu.clientHeight > window.innerHeight - docRect.top) {
      y -= menu.clientHeight;
      transformY = "bottom";
    }

    setTransformOrigin(transformY + " " + transformX);
    setX(x);
    setY(y);
  }

  // reactively use contextmenu mouse event to open
  createEffect(
    on(
      () => props.event,
      (event) => {
        if (event != null) {
          event.preventDefault();
          queueMicrotask(() => menuRef?.focus());
          setPosAnimData(event);
          setShow("show");
        } else {
          setShow("hide");
        }
      }
    )
  );

  const mouseDownListener = (e: MouseEvent) => {
    if (e.button == 2) {
      setShow("");
    } else {
      setShow("hide");
    }
  };
  const keydownListener = applyFilter(escapeKeyFilter)(() => setShow("hide"));
  const scrollListener = () => setShow("hide");
  const resizeListener = () => setShow("hide");

  createEffect(() => {
    if (show() === "show") {
      setTimeout(() => {
        window.addEventListener("mousedown", mouseDownListener);
        window.addEventListener("keydown", keydownListener);
        window.addEventListener("scroll", scrollListener);
        window.addEventListener("resize", resizeListener);
      });
    }
    onCleanup(() => {
      window.removeEventListener("mousedown", mouseDownListener);
      window.removeEventListener("keydown", keydownListener);
      window.removeEventListener("scroll", scrollListener);
      window.removeEventListener("resize", resizeListener);
    });
  });

  return (
    <Portal mount={document.getElementById("context")!}>
      <div
        tabIndex={0}
        ref={menuRef}
        class={`floating-menu context hide-focus ${show()}`}
        style={`
          left: ${x()}px;
          top: ${y()}px;
          transform-origin: ${transformOrigin()};
        `}
        onMouseDown={(e) => e.stopPropagation()}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onMouseUp={() => setShow("hide")}
        onKeyDown={applyFilter(enterKeyFilter)(() => setShow("hide"))}
      >
        {props.children}
      </div>
    </Portal>
  );
};
