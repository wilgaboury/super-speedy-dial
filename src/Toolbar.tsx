import {
  Component,
  For,
  JSX,
  Match,
  Show,
  createEffect,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";
import { assertExhaustive, openUrlClick, run } from "./utils/assorted";
import {
  BiLogosFirefox,
  BiLogosGithub,
  BiRegularMenu,
  BiRegularMinus,
  BiRegularRefresh,
  BiRegularSearch,
  BiSolidBookmarkPlus,
  BiSolidCog,
  BiSolidFolderPlus,
  BiSolidHelpCircle,
  BiSolidInfoCircle,
  BiSolidWrench,
} from "solid-icons/bi";
import { SettingsContext } from "./settings";
import { Dropdown } from "./Dropdown";
import { ContextMenuSeparator } from "./ContextMenu";
import { setAllowScroll } from "./Modal";
import { setShowSidebar } from "./Sidebar";
import Search from "./Search";

export const ToolbarKinds = [
  "search",
  "bookmark",
  "folder",
  "github",
  "firefox",
  "reload",
  "help",
  "about",
  "settings",
  "separator",
  "customize",
] as const;
export type ToolbarKind = (typeof ToolbarKinds)[number];
export const ToolbarKindsSet = new Set<string>(ToolbarKinds);

function toolbarKindDisplayString(kind: ToolbarKind): string {
  switch (kind) {
    case "bookmark":
      return "Add folder";
    case "folder":
      return "Add bookmark";
    case "search":
    case "github":
    case "firefox":
    case "reload":
    case "help":
    case "about":
    case "settings":
    case "separator":
    case "customize":
      return kind.charAt(0).toUpperCase() + kind.slice(1);
    default:
      return assertExhaustive(kind);
  }
}

const ToolbarButtonIcon: Component<{
  kind: ToolbarKind;
  size: number;
}> = (props) => {
  return (
    <>
      {run(() => {
        const kind = props.kind;
        const size = props.size;
        switch (kind) {
          case "search":
            return <BiRegularSearch size={size} />;
          case "bookmark":
            return <BiSolidBookmarkPlus size={size} />;
          case "folder":
            return <BiSolidFolderPlus size={size} />;
          case "github":
            return <BiLogosGithub size={size} />;
          case "firefox":
            return <BiLogosFirefox size={size} />;
          case "reload":
            return <BiRegularRefresh size={size} />;
          case "help":
            return <BiSolidHelpCircle size={size} />;
          case "about":
            return <BiSolidInfoCircle size={size} />;
          case "settings":
            return <BiSolidCog size={size} />;
          case "separator":
            return <BiRegularMinus size={size} />;
          case "customize":
            return <BiSolidWrench size={size} />;
          default:
            return assertExhaustive(kind);
        }
      })}
    </>
  );
};

const buttonIconSize = 20;

interface ToolbarButtonItemProps {
  readonly setOnClick: (fn: (e: MouseEvent) => void) => void;
}

const SearchToolbarButtonItem: Component<ToolbarButtonItemProps> = (props) => {
  const [showSearch, setShowSearch] = createSignal(false);
  props.setOnClick(() => setShowSearch(true));
  const keydownListener = (e: KeyboardEvent) => {
    if (e.key == "F3" || (e.ctrlKey && e.key == "f")) {
      e.preventDefault();
      e.stopImmediatePropagation();
      setShowSearch(true);
    }
  };
  window.addEventListener("keydown", keydownListener);
  onCleanup(() => window.removeEventListener("keydown", keydownListener));
  return <Search show={showSearch()} onClose={() => setShowSearch(false)} />;
};

interface ToolbarButtonWrapperProps<U extends JSX.Element> {
  readonly kind: ToolbarKind; // not reactive
  readonly children: (onClick: (e: MouseEvent) => void) => U;
}

function ToolbarButtonWrapper<U extends JSX.Element>(
  props: ToolbarButtonWrapperProps<U>
) {
  const kind = props.kind;

  let onClick: (e: MouseEvent) => void;
  const setOnClick = (fn: (e: MouseEvent) => void) => (onClick = fn);

  switch (kind) {
    case "github":
      onClick = (e) =>
        openUrlClick(
          "https://github.com/wilgaboury/super-speedy-dial",
          e.ctrlKey
        );
      break;
    case "firefox":
      onClick = (e) =>
        openUrlClick(
          "https://addons.mozilla.org/en-US/firefox/addon/super-speedy-dial/",
          e.ctrlKey
        );
      break;
    case "settings":
      onClick = () => {
        setAllowScroll(false);
        setShowSidebar(true);
      };
      break;
  }

  return (
    <>
      {props.children((e) => onClick(e))}
      {run(() => {
        switch (kind) {
          case "search":
            return <SearchToolbarButtonItem setOnClick={setOnClick} />;
          // case "bookmark":
          //   return <BiSolidBookmarkPlus size={size} />;
          // case "folder":
          //   return <BiSolidFolderPlus size={size} />;
          // case "reload":
          //   return <BiRegularRefresh size={size} />;
          // case "help":
          //   return <BiSolidHelpCircle size={size} />;
          // case "about":
          //   return <BiSolidInfoCircle size={size} />;
          // case "settings":
          //   return <BiSolidCog size={size} />;
          // case "separator":
          //   return <BiRegularMinus size={size} />;
          // case "customize":
          //   return <BiSolidWrench size={size} />;
        }
      })}
    </>
  );
}

export const Toolbar: Component = () => {
  const [settings] = useContext(SettingsContext);
  const [showOverflow, setShowOverflow] = createSignal<boolean>();

  return (
    <div
      class="header-item dropdown-container"
      style={{ display: "flex", gap: "5px" }}
    >
      <For each={settings.toolbar}>
        {(kind) => (
          <ToolbarButtonWrapper kind={kind}>
            {(onClick) => (
              <button class="borderless" onClick={onClick}>
                <ToolbarButtonIcon kind={kind} size={buttonIconSize} />
              </button>
            )}
          </ToolbarButtonWrapper>
        )}
      </For>
      <Show when={settings.toolbarOverflow.length > 0}>
        <button
          class="borderless"
          onMouseDown={(e) => {
            // prevent dropdown global listeners from picking up event
            e.stopPropagation();
          }}
          onClick={() => setShowOverflow(!showOverflow())}
        >
          <BiRegularMenu size={buttonIconSize} />
        </button>
      </Show>
      <Dropdown
        show={showOverflow()}
        onClose={() => setShowOverflow(false)}
        justify="left"
      >
        <div
          class="floating-menu"
          // same callback structure as ContextMenu, to get proper floating menu click behavior
          onMouseDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
          onMouseUp={() => setShowOverflow(false)}
        >
          <For each={settings.toolbarOverflow}>
            {(kind) => (
              <ToolbarButtonWrapper kind={kind}>
                {(onClick) => (
                  <Show
                    when={kind !== "separator"}
                    fallback={<ContextMenuSeparator />}
                  >
                    <button class="borderless" onClick={onClick}>
                      <ToolbarButtonIcon kind={kind} size={buttonIconSize} />
                      <div style={{ "margin-right": "10px" }} />
                      {toolbarKindDisplayString(kind)}
                    </button>
                  </Show>
                )}
              </ToolbarButtonWrapper>
            )}
          </For>
        </div>
      </Dropdown>
    </div>
  );
};
