import {
  Accessor,
  createDeferred,
  createEffect,
  createSignal,
  Setter,
} from "solid-js";
import { storageGet, storagePut } from "./database";

export interface Settings {
  readonly defaultFolder: Accessor<string>;
  readonly setDefaultFolder: Setter<string>;
  readonly backgroundColor: Accessor<string>;
  readonly setBackgroundColor: Setter<string>;
  readonly useBackgroundColor: Accessor<boolean>;
  readonly setUseBackgroundColor: Setter<boolean>;
  readonly lightMode: Accessor<boolean>;
  readonly setLightMode: Setter<boolean>;
}

function Settings(): Settings {
  const [defaultFolder, setDefaultFolder] = createSignal("root________");
  const [backgroundColor, setBackgroundColor] = createSignal("#000000");
  const [useBackgroundColor, setUseBackgroundColor] = createSignal(true);
  const [lightMode, setLightMode] = createSignal(true);

  return {
    defaultFolder,
    setDefaultFolder,
    backgroundColor,
    setBackgroundColor,
    useBackgroundColor,
    setUseBackgroundColor,
    lightMode,
    setLightMode,
  };
}

export interface SettingsValues {
  readonly defaultFolder?: string;
  readonly backgroundColor?: string;
  readonly useBackgroundColor?: boolean;
  readonly lightMode?: boolean;
}

export const settings = Settings();

const saveSettings = createDeferred<SettingsValues>(() => ({
  defaultFolder: settings.defaultFolder(),
  backgroundColor: settings.backgroundColor(),
  useBackgroundColor: settings.useBackgroundColor(),
  lightMode: settings.lightMode(),
}));

storageGet<SettingsValues>(["settings"]).then((s) => {
  if (s != null) {
    if (s.defaultFolder != null) settings.setDefaultFolder(s.defaultFolder);
    if (s.backgroundColor != null)
      settings.setBackgroundColor(s.backgroundColor);
    if (s.useBackgroundColor != null)
      settings.setUseBackgroundColor(s.useBackgroundColor);
    if (s.lightMode != null) settings.setLightMode(s.lightMode);
  }
  createEffect(() => {
    storagePut(["settings"], saveSettings());
  });
});
