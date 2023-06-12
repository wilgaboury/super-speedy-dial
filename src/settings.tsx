import {
  ParentComponent,
  Show,
  createContext,
  createEffect,
  createSignal,
} from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import { bookmarks } from "webextension-polyfill";
import { storageGet, storageSet } from "./utils/database";
import { isFolder, rootFolderId } from "./utils/bookmark";
import { difference } from "./utils/assorted";
import { ToolbarKind, ToolbarKinds, ToolbarKindsSet } from "./Toolbar";
import { debounce } from "@solid-primitives/scheduled";
import { trackStore } from "@solid-primitives/deep";

export interface ToolbarState {
  readonly toolbar: ReadonlyArray<ToolbarKind>;
  readonly toolbarOverflow: ReadonlyArray<ToolbarKind>;
  readonly toolbarUnused: ReadonlyArray<ToolbarKind>;
}

export interface Settings extends ToolbarState {
  readonly defaultFolder: string;
  readonly backgroundColor: string;
  readonly useBackgroundColor: boolean;
  readonly lightMode: boolean;
  readonly tileWidth: number;
  readonly tileHeight: number;
  readonly tileFont: number;
  readonly tileGap: number;
  readonly consent: boolean;
}

const defaultSettings: Settings = {
  defaultFolder: rootFolderId,
  backgroundColor: "#110053",
  useBackgroundColor: true,
  lightMode: true,
  tileWidth: 200,
  tileHeight: 125,
  tileFont: 14,
  tileGap: 40,
  toolbar: ["search", "bookmark", "folder", "settings"],
  toolbarOverflow: [
    "reload",
    "settings",
    "separator",
    "firefox",
    "github",
    "separator",
    "help",
    "about",
    "customize",
  ],
  toolbarUnused: [],
  consent: false,
};

const [settings, setSettings] = createStore<Settings>(defaultSettings);
const [settingsLoaded, setSettingsLoaded] = createSignal(false);

storageGet<Partial<Settings>>(["settings"]).then(async (stored) => {
  if (stored != null) setSettings(stored);

  setSettings(makeToolbarsValid);

  // attempt to load folder and default to root or error so user can't end up in unreachable location
  try {
    const defaultFolder = (await bookmarks.get(settings.defaultFolder))[0];
    if (!isFolder(defaultFolder)) throw true;
  } catch (_) {
    setSettings((s) => ({ ...s, defaultFolder: rootFolderId }));
  }

  // create light/dark mode effect on top level of document
  createEffect(() => {
    if (settings.lightMode) document.documentElement.classList.remove("dark");
    else document.documentElement.classList.add("dark");
  });

  setSettingsLoaded(true);

  const saveSettings = debounce(
    (store) => storageSet(["settings"], store),
    200
  );
  createEffect(() => saveSettings(unwrap(trackStore(settings))));
});

export const SettingsContext = createContext<[Settings, typeof setSettings]>([
  settings,
  setSettings,
]);

export const SettingsProvider: ParentComponent = (props) => {
  return (
    <Show when={settingsLoaded()}>
      <SettingsContext.Provider value={[settings, setSettings]}>
        {props.children}
      </SettingsContext.Provider>
    </Show>
  );
};

/**
 * @returns array, first element is unique modified lists and second is unused kinds
 */
function makeToolbarsUnique(
  toolbars: ReadonlyArray<ReadonlyArray<ToolbarKind>>
): [Array<Array<ToolbarKind>>, Array<ToolbarKind>] {
  const all = new Set<ToolbarKind>();
  const cur: Array<ToolbarKind> = [];
  const ret: Array<Array<ToolbarKind>> = [];

  for (const toolbar of toolbars) {
    cur.length = 0;
    // filter ensures that only actual toolbar item types are being allowed into the result
    for (const kind of toolbar.filter((kind) => ToolbarKindsSet.has(kind))) {
      // there can be any number of "separator"
      if (!all.has(kind) || kind === "separator") {
        all.add(kind);
        cur.push(kind);
      }
    }
    ret.push([...cur]);
  }

  return [ret, [...difference(new Set(ToolbarKinds), all)]];
}

function makeToolbarsValid(toolbars: ToolbarState): ToolbarState {
  let [[toolbar, toolbarOverflow, toolbarUnused], missing] = makeToolbarsUnique(
    [toolbars.toolbar, toolbars.toolbarOverflow, toolbars.toolbarUnused]
  );

  // ensure there are no separator's in the toolbar
  toolbar.push(...missing);
  toolbar = toolbar.filter((kind) => kind !== "separator");

  // possibly add separator to unused
  toolbarUnused = [...new Set<ToolbarKind>([...toolbarUnused, "separator"])]; // set union

  // check that customize is available in UI (i.e. toolbar or overflow)
  if (
    !toolbar.includes("customize") &&
    !toolbarOverflow.includes("customize")
  ) {
    const idx = toolbarUnused.indexOf("customize");
    if (idx >= 0) toolbarUnused.splice(idx, 1);
    toolbar.push("customize");
  }

  return {
    toolbar,
    toolbarOverflow,
    toolbarUnused,
  };
}
