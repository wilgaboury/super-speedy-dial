import {
  JSX,
  ParentComponent,
  createMemo,
  createResource,
  createSignal,
  splitProps,
  useContext,
} from "solid-js";
import { backgroundImageStore, dbGet } from "./utils/database";
import { SettingsContext } from "./settings";
import { getObjectUrl } from "./utils/assorted";

export const backgroundKey = "background";

export const [storedBackground] = createResource<Blob | undefined>(async () => {
  const background = await dbGet(backgroundImageStore, backgroundKey);
  return background instanceof Blob ? background : undefined;
});
export const storedBackgroundUrl = createMemo(() => {
  const background = storedBackground();
  if (background == null) return undefined;
  return getObjectUrl(background);
});
export const [adHocBackground, setAdHocBackground] = createSignal<Blob>();

const BackgroundWrapper: ParentComponent<JSX.HTMLAttributes<HTMLDivElement>> = (
  props
) => {
  const [settings] = useContext(SettingsContext);
  const [local, rest] = splitProps(props, ["children", "style"]);

  const background = createMemo(() => {
    const adHoc = adHocBackground();
    if (adHoc != null) return getObjectUrl(adHoc);
    const stored = storedBackground();
    if (stored != null) return getObjectUrl(stored);
    return undefined;
  });

  const style = createMemo(() =>
    typeof local.style === "string" ? undefined : local.style
  );

  return (
    <div
      style={{
        "background-image":
          !settings.useBackgroundColor && background() != null
            ? `url(${background()})`
            : "",
        "background-color": settings.useBackgroundColor
          ? settings.backgroundColor
          : "",
        ...style(),
      }}
      {...rest}
    >
      {local.children}
    </div>
  );
};

export default BackgroundWrapper;
