import { ParentComponent, Show, createContext, createSignal } from "solid-js";
import { storageGet, storagePut } from "./database";
import { createStore, unwrap } from "solid-js/store";
import { createDebounced, deepTrack } from "./utils";

export interface Settings {
  readonly defaultFolder: string;
  readonly backgroundColor: string;
  readonly useBackgroundColor: boolean;
  readonly lightMode: boolean;
}

const defaultSettings: Settings = {
  defaultFolder: "root________",
  backgroundColor: "#085d77",
  useBackgroundColor: true,
  lightMode: true,
};

const [settings, setSettings] = createStore<Settings>(defaultSettings);
const [settingsLoaded, setSettingsLoaded] = createSignal(false);

storageGet<Partial<Settings>>(["settings"]).then((s) => {
  if (s != null) setSettings(s);
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
