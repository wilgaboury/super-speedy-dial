import { ParentComponent, useContext } from "solid-js";
import { createSignal } from "solid-js";
import { backgroundImageStore, dbGet } from "./database";
import { SettingsContext } from "./settings";

export const [background, setBackground] = createSignal<string>();
export const backgroundKey = "background";

const BackgroundWrapper: ParentComponent = (props) => {
  const [settings, setSettings] = useContext(SettingsContext);

  dbGet<Blob>(backgroundImageStore, backgroundKey).then((value) => {
    if (value != null) {
      setBackground(URL.createObjectURL(value));
    } else {
      setSettings({ useBackgroundColor: true });
    }
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
