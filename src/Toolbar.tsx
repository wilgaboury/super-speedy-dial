import {
  Component,
  For,
  JSX,
  Show,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";
import {
  assertExhaustive,
  isValidUrl,
  onEnterKey,
  openUrlClick,
  run,
} from "./utils/assorted";
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
import { Modal, setAllowScroll } from "./Modal";
import { setShowSidebar } from "./Sidebar";
import Search from "./Search";
import { FolderStateContext } from "./Folder";

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

const BookmarkToolbarButtonItem: Component<ToolbarButtonItemProps> = (
  props
) => {
  const folderState = useContext(FolderStateContext);
  let newBookmarkNameRef: HTMLInputElement | undefined;
  const [showNewBookmark, setShowNewBookmark] = createSignal(false);
  const [bookmarkTitle, setBookmarkTitle] = createSignal("");
  const [bookmarkUrl, setBookmarkUrl] = createSignal("");

  props.setOnClick(() => {
    setShowNewBookmark(true);
    newBookmarkNameRef?.focus();
  });

  function maybeAddHttps(url: string) {
    if (isValidUrl(url)) return url;
    else return "https://" + url;
  }

  function canNewBookmark() {
    return (
      bookmarkTitle().length > 0 &&
      (isValidUrl(bookmarkUrl()) || isValidUrl("https://" + bookmarkUrl()))
    );
  }

  function newBookmark() {
    if (!canNewBookmark()) return;

    folderState.createChild({
      title: bookmarkTitle(),
      url: maybeAddHttps(bookmarkUrl()),
    });

    setShowNewBookmark(false);
    setBookmarkTitle("");
    setBookmarkUrl("");
  }

  return (
    <Modal show={showNewBookmark()} onClose={() => setShowNewBookmark(false)}>
      <div class="modal-content" style={{ width: "325px" }}>
        <div>Name</div>
        <input
          ref={newBookmarkNameRef}
          type="text"
          class="default"
          value={bookmarkTitle()}
          onInput={(e) => setBookmarkTitle(e.target.value)}
          onKeyDown={onEnterKey(newBookmark)}
        />
        <div>Url</div>
        <input
          type="text"
          class="default"
          value={bookmarkUrl()}
          onInput={(e) => setBookmarkUrl(e.target.value)}
          onKeyDown={onEnterKey(newBookmark)}
        />
      </div>
      <div class="modal-separator" />
      <div class="modal-buttons">
        <button
          class={`save ${canNewBookmark() ? "" : "disabled"}`}
          onClick={newBookmark}
        >
          Create
        </button>
        <button onClick={() => setShowNewBookmark(false)}>Cancel</button>
      </div>
    </Modal>
  );
};

const FolderToolbarButtonItem: Component<ToolbarButtonItemProps> = (props) => {
  const folderState = useContext(FolderStateContext);
  let newFolderNameRef: HTMLInputElement | undefined;
  const [showNewFolder, setShowNewFolder] = createSignal(false);
  const [folderTitle, setFolderTitle] = createSignal("");

  props.setOnClick(() => {
    setShowNewFolder(true);
    newFolderNameRef?.focus();
  });

  function canNewFolder() {
    return folderTitle().length > 0;
  }

  function newFolder() {
    if (!canNewFolder()) return;

    folderState.createChild({ title: folderTitle() });

    setShowNewFolder(false);
    setFolderTitle("");
  }

  return (
    <Modal show={showNewFolder()} onClose={() => setShowNewFolder(false)}>
      <div class="modal-content" style={{ width: "325px" }}>
        <div>Name</div>
        <input
          ref={newFolderNameRef}
          type="text"
          class="default"
          value={folderTitle()}
          onInput={(e) => setFolderTitle(e.target.value)}
          onKeyDown={onEnterKey(newFolder)}
        />
      </div>
      <div class="modal-separator" />
      <div class="modal-buttons">
        <button
          class={`save ${canNewFolder() ? "" : "disabled"}`}
          onClick={newFolder}
        >
          Create
        </button>
        <button onClick={() => setShowNewFolder(false)}>Cancel</button>
      </div>
    </Modal>
  );
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
          case "bookmark":
            return <BookmarkToolbarButtonItem setOnClick={setOnClick} />;
          case "folder":
            return <FolderToolbarButtonItem setOnClick={setOnClick} />;
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
