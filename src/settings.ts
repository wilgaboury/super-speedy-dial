import { createEffect, createSignal } from "solid-js";
import { storageGet, storagePut } from "./database";

export interface Settings {
  readonly defaultFolder: string;
  readonly lightMode: boolean;
}

const [settings, setSettings] = createSignal<Settings>({
  defaultFolder: "root________",
  lightMode: true,
});

createEffect(() => {
  storagePut(["settings"], settings());
});

storageGet<Settings>(["settings"]).then((s) => {
  if (s != null) setSettings(s);
});
