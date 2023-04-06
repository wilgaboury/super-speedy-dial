import { ParentComponent, createMemo, useContext } from "solid-js";
import { createSignal } from "solid-js";
import { backgroundImageStore, dbGet, getDb } from "./database";
import { SettingsContext } from "./settings";

export const backgroundKey = "background";

export const [storedBackground, setStoredBackground] = createSignal<Blob>();

export const storedBackgroundUrl = createMemo(() => {
  const sb = storedBackground();
  if (sb != null) return URL.createObjectURL(sb);
  return undefined;
});
export const [adHocBackground, setAdHocBackground] = createSignal<Blob>();
export const adHocBackgroundUrl = createMemo(() => {
  const adb = adHocBackground();
  if (adb != null) return URL.createObjectURL(adb);
  return undefined;
});

const BackgroundWrapper: ParentComponent = (props) => {
  const [settings] = useContext(SettingsContext);

  const background = createMemo(() => {
    const adHoc = adHocBackgroundUrl();
    if (adHoc != null) return adHoc;
    const stored = storedBackgroundUrl();
    if (stored != null) return stored;
    return undefined;
  });

  // TODO: this is a bad way to load the background but using createResource outside component for some reason has some sort of race condition with indexdb
  dbGet<Blob>(backgroundImageStore, backgroundKey).then(setStoredBackground);

  return (
    <div
      class="background"
      style={{
        "background-image":
          !settings.useBackgroundColor && background() != null
            ? `url(${background()})`
            : "",
        "background-color": settings.useBackgroundColor
          ? settings.backgroundColor
          : "",
      }}
    >
      {props.children}
    </div>
  );
};

export default BackgroundWrapper;
