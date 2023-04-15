import {
  ParentComponent,
  Show,
  createContext,
  createEffect,
  createReaction,
  createResource,
  createSignal,
} from "solid-js";
import { createStore, unwrap } from "solid-js/store";
import { bookmarks, permissions } from "webextension-polyfill";
import { storageGet, storagePut } from "./database";
import { createDebounced, deepTrack } from "./utils";

export interface Settings {
  readonly defaultFolder: string;
  readonly backgroundColor: string;
  readonly useBackgroundColor: boolean;
  readonly lightMode: boolean;
}

const rootFolderId = "root________";

const defaultSettings: Settings = {
  defaultFolder: rootFolderId,
  backgroundColor: "#110053",
  useBackgroundColor: true,
  lightMode: true,
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
    (value) => storagePut(["settings"], value)
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
