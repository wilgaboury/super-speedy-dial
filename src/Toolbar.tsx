import {
  Component,
  For,
  JSX,
  Show,
  createMemo,
  createSignal,
  onCleanup,
  useContext,
} from "solid-js";
import {
  assertExhaustive,
  isValidUrl,
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
  BiRegularX,
  BiSolidBookmarkPlus,
  BiSolidCog,
  BiSolidFolderPlus,
  BiSolidHelpCircle,
  BiSolidInfoCircle,
  BiSolidWrench,
} from "solid-icons/bi";
import { SettingsContext, ToolbarFontOffest } from "./settings";
import { Dropdown } from "./Dropdown";
import { ContextMenuSeparator } from "./ContextMenu";
import { setShowSidebar } from "./Sidebar";
import Search from "./Search";
import { FolderStateContext } from "./Folder";
import { getDb, tileImageStore } from "./utils/database";
import { Bookmarks, runtime } from "webextension-polyfill";
import { rootFolderId } from "./utils/bookmark";
import logo from "./assets/logo.png";
import CustomizeToolbar from "./CustomizeToolbar";
import {
  propegationFilter,
  filterPropegation,
  applyFilter,
  enterKeyFilter,
} from "./utils/filter";
import { useNavigate } from "@solidjs/router";
import { Modal } from "./Modal";

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

export function toolbarKindDisplayString(kind: ToolbarKind): string {
  switch (kind) {
    case "bookmark":
      return "Add folder";
    case "folder":
      return "Add bookmark";
    default:
      return kind.charAt(0).toUpperCase() + kind.slice(1);
  }
}

export const ToolbarButtonIcon: Component<{
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
          onKeyDown={applyFilter(enterKeyFilter)(newBookmark)}
        />
        <div>Url</div>
        <input
          type="text"
          class="default"
          value={bookmarkUrl()}
          onInput={(e) => setBookmarkUrl(e.target.value)}
          onKeyDown={applyFilter(enterKeyFilter)(newBookmark)}
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
          onKeyDown={applyFilter(enterKeyFilter)(newFolder)}
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

const ReloadToolbarButtonItem: Component<ToolbarButtonItemProps> = (props) => {
  const [showReloadConfirm, setShowReloadConfim] = createSignal(false);
  props.setOnClick(() => setShowReloadConfim(true));

  async function reloadImageCache() {
    await (await getDb()).clear(tileImageStore);
    location.reload();
  }

  return (
    <Modal
      show={showReloadConfirm()}
      onClose={() => setShowReloadConfim(false)}
    >
      <div class="modal-content" style={{ "max-width": "550px" }}>
        Confirm you would like to delete all cached tile images
      </div>
      <div class="modal-separator" />
      <div class="modal-buttons">
        <button class="delete" onClick={reloadImageCache}>
          Delete
        </button>
        <button onClick={() => setShowReloadConfim(false)}>Cancel</button>
      </div>
    </Modal>
  );
};

const AboutToolbarButtonItem: Component<ToolbarButtonItemProps> = (props) => {
  const [showAbout, setShowAbout] = createSignal(false);
  props.setOnClick(() => setShowAbout(true));

  return (
    <Modal
      show={showAbout()}
      onClose={() => setShowAbout(false)}
      closeOnBackgruondClick
    >
      <div
        style={{
          display: "flex",
          position: "relative",
          padding: "30px",
          gap: "30px",
          "align-items": "stretch",
        }}
      >
        <img src={logo} width={200} height={200} />
        <div
          style={{
            display: "flex",
            "flex-direction": "column",
            "justify-content": "center",
            gap: "8px",
            width: "300px",
          }}
        >
          <div style={{ "font-size": "30px" }}>
            {runtime.getManifest().name}
          </div>
          <div>{runtime.getManifest().description}</div>
          <div>Version: {runtime.getManifest().version}</div>
          <div>Developed by Wil Gaboury</div>
          <div></div>
        </div>
        <button
          class="borderless"
          onClick={() => setShowAbout(false)}
          style={{
            top: "0",
            right: "0",
            position: "absolute",
            margin: "5px",
          }}
        >
          <BiRegularX size={24} />
        </button>
      </div>
    </Modal>
  );
};

const CustomizeToolbarButtonItem: Component<ToolbarButtonItemProps> = (
  props
) => {
  const [showCustomize, setShowCustomize] = createSignal(false);
  props.setOnClick(() => setShowCustomize(true));
  return (
    <CustomizeToolbar
      show={showCustomize()}
      onClose={() => setShowCustomize(false)}
    />
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

  const navigate = useNavigate();

  switch (kind) {
    case "github":
      onClick = (e) =>
        openUrlClick("https://github.com/wilgaboury/super-speedy-dial", e);
      break;
    case "firefox":
      onClick = (e) =>
        openUrlClick(
          "https://addons.mozilla.org/en-US/firefox/addon/super-speedy-dial/",
          e
        );
      break;
    case "settings":
      onClick = () => setShowSidebar(true);
      break;
    case "help":
      onClick = () => navigate("/help");
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
          case "reload":
            return <ReloadToolbarButtonItem setOnClick={setOnClick} />;
          case "about":
            return <AboutToolbarButtonItem setOnClick={setOnClick} />;
          case "customize":
            return <CustomizeToolbarButtonItem setOnClick={setOnClick} />;
        }
      })}
    </>
  );
}

export const Toolbar: Component<{ node: Bookmarks.BookmarkTreeNode }> = (
  props
) => {
  const [settings] = useContext(SettingsContext);
  const [showOverflow, setShowOverflow] = createSignal<boolean>();

  function rootFilter(kind: ToolbarKind): boolean {
    return kind !== "bookmark" && kind !== "folder";
  }

  const toolbarKinds = createMemo(() =>
    props.node.id === rootFolderId
      ? settings.toolbar.filter(rootFilter)
      : settings.toolbar
  );

  const toolbarOverflowKinds = createMemo(() =>
    props.node.id === rootFolderId
      ? settings.toolbarOverflow.filter(rootFilter)
      : settings.toolbarOverflow
  );

  return (
    <div
      class="header-item dropdown-container"
      style={{ display: "flex", gap: "5px" }}
    >
      <For each={toolbarKinds()}>
        {(kind) => (
          <Show
            when={kind !== "separator"}
            fallback={
              <div
                style={{
                  "border-left": "1px solid var(--text-color)",
                  margin: "5px",
                }}
              />
            }
          >
            <ToolbarButtonWrapper kind={kind}>
              {(onClick) => (
                <button class="borderless" onClick={onClick}>
                  <ToolbarButtonIcon kind={kind} size={settings.toolbarFont} />
                </button>
              )}
            </ToolbarButtonWrapper>
          </Show>
        )}
      </For>
      <Show when={toolbarOverflowKinds().length > 0}>
        <button
          class="borderless"
          onMouseDown={(e) => filterPropegation(e, "toolbar")}
          onClick={() => setShowOverflow(!showOverflow())}
        >
          <BiRegularMenu size={settings.toolbarFont} />
        </button>
      </Show>
      <Dropdown
        show={showOverflow()}
        onClose={() => setShowOverflow(false)}
        justify="left"
        mouseDownEventFilter={propegationFilter(["toolbar"])}
      >
        <div
          class="floating-menu"
          // same callback structure as ContextMenu, to get proper floating menu click behavior
          onMouseDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
          onMouseUp={() => setShowOverflow(false)}
        >
          <For each={toolbarOverflowKinds()}>
            {(kind) => (
              <ToolbarButtonWrapper kind={kind}>
                {(onClick) => (
                  <Show
                    when={kind !== "separator"}
                    fallback={<ContextMenuSeparator />}
                  >
                    <button
                      class="borderless"
                      onClick={onClick}
                      style={{
                        "font-size": `${
                          settings.toolbarFont + ToolbarFontOffest
                        }px`,
                      }}
                    >
                      <ToolbarButtonIcon
                        kind={kind}
                        size={settings.toolbarFont}
                      />
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
