import {
  Component,
  For,
  Match,
  Show,
  createEffect,
  createSignal,
  useContext,
} from "solid-js";
import { assertExhaustive, run } from "./utils/assorted";
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

function toolbarKindToDisplay(kind: ToolbarKind): string {
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

export const Toolbar: Component = () => {
  const [settings] = useContext(SettingsContext);
  const [showOverflow, setShowOverflow] = createSignal(false);

  createEffect(() => console.log(showOverflow()));

  function onClick(kind: ToolbarKind) {
    return (e: MouseEvent) => {
      console.log("hello");
      switch (kind) {
        case "search":
        case "bookmark":
        case "folder":
        case "github":
        case "firefox":
        case "reload":
        case "help":
        case "about":
        case "settings":
        case "separator":
        case "customize":
          break;
        default:
          return assertExhaustive(kind);
      }
    };
  }

  return (
    <div
      class="header-item dropdown-container"
      style={{ display: "flex", gap: "5px" }}
    >
      <For each={settings.toolbar}>
        {(kind) => (
          <button class="borderless" onClick={onClick(kind)}>
            <ToolbarButtonIcon kind={kind} size={buttonIconSize} />
          </button>
        )}
      </For>
      <Show when={settings.toolbarOverflow.length > 0}>
        <button
          class="borderless"
          onClick={() => {
            console.log("test");
            setShowOverflow(true);
          }}
        >
          <BiRegularMenu size={buttonIconSize} />
        </button>
      </Show>
      <Dropdown
        show={showOverflow()}
        onClose={() => setShowOverflow(false)}
        justify="left"
      >
        <div class="context-menu">
          <For each={settings.toolbarOverflow}>
            {(kind) => (
              <Show
                when={kind === "separator"}
                fallback={
                  <button class="borderless" onClick={onClick(kind)}>
                    <ToolbarButtonIcon kind={kind} size={buttonIconSize} />
                    <div style={{ "margin-right": "10px" }} />
                    {toolbarKindToDisplay(kind)}
                  </button>
                }
              >
                <ContextMenuSeparator />
              </Show>
            )}
          </For>
        </div>
      </Dropdown>
    </div>
  );
};
