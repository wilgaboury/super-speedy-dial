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
import { rootFolderId } from "./utils/bookmark";
import { createDebounced, deepTrack } from "./utils/assorted";

export interface Settings {
  readonly defaultFolder: string;
  readonly backgroundColor: string;
  readonly useBackgroundColor: boolean;
  readonly lightMode: boolean;
  readonly tileWidth: number;
  readonly tileHeight: number;
  readonly tileFont: number;
  readonly tileGap: number;
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
};

const [settings, setSettings] = createStore<Settings>(defaultSettings);
const [settingsLoaded, setSettingsLoaded] = createSignal(false);

storageGet<Partial<Settings>>(["settings"]).then(async (s) => {
  if (s != null) setSettings(s);

  try {
    await bookmarks.get(settings.defaultFolder);
  } catch (_) {
    setSettings((s) => ({ ...s, defaultFolder: rootFolderId }));
  }

  createEffect(() => {
    if (settings.lightMode) document.documentElement.classList.remove("dark");
    else document.documentElement.classList.add("dark");
  });

  setSettingsLoaded(true);

  createDebounced(
    () => {
      deepTrack(settings);
      return unwrap(settings);
    },
    (value) => storageSet(["settings"], value)
  );
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
