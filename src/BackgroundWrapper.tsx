import {
  ParentComponent,
  createMemo,
  createResource,
  createSignal,
  useContext,
} from "solid-js";
import { backgroundImageStore, dbGet } from "./utils/database";
import { SettingsContext } from "./settings";

export const backgroundKey = "background";

export const [storedBackground] = createResource<Blob | null>(async () => {
  const background = await dbGet(backgroundImageStore, backgroundKey);
  return background instanceof Blob ? background : null;
});

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
