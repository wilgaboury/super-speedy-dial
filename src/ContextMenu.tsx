import {
  Component,
  createEffect,
  createSignal,
  JSX,
  on,
  onMount,
  ParentComponent,
} from "solid-js";
import { Portal } from "solid-js/web";
import { onEnterKeyDown } from "./utils/assorted";

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
  return (
    <div style={{ "border-bottom": "solid 1px gray", margin: "5px 10px" }} />
  );
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

  function open(event?: MouseEvent) {
    const menu = menuRef!;

    if (event != null) {
      event.preventDefault();
      event.stopImmediatePropagation();

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
      setShow("show");
    } else {
      setShow("hide");
    }
  }

  onMount(() => createEffect(on(() => props.event, open, { defer: true })));

  document.addEventListener("mousedown", (e) => {
    if (e.button == 2) {
      setShow("");
    } else {
      setShow("hide");
    }
  });
  document.addEventListener("scroll", () => setShow("hide"));
  document.addEventListener("contextmenu", () => {
    if (show()) {
      setShow("");
    }
  });
  window.addEventListener("resize", () => setShow("hide"));

  return (
    <Portal mount={document.getElementById("context")!}>
      <div
        tabIndex={0}
        ref={menuRef}
        class={`context-menu hide-focus ${show()}`}
        style={`
          left: ${x()}px;
          top: ${y()}px;
          transform-origin: ${transformOrigin()};
        `}
        onMouseDown={(e) => e.stopImmediatePropagation()}
        onMouseUp={() => setShow("hide")}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopImmediatePropagation();
        }}
        onKeyDown={onEnterKeyDown(() => setShow("hide"))}
        onTransitionEnd={() => {
          // Calling focus at the end of open() was causing the screen to jump to the top of the page
          // but focusing after the transition has finished seems to work fine.
          if (show() == "show") menuRef?.focus();
        }}
      >
        {props.children}
      </div>
    </Portal>
  );
};
