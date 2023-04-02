import { ParentComponent, useContext } from "solid-js";
import { createSignal } from "solid-js";
import { backgroundImageStore, dbGet } from "./database";
import { SettingsContext } from "./settings";
import { showSidebar } from "./Sidebar";

export const [background, setBackground] = createSignal<string>();

dbGet<Blob>(backgroundImageStore, "current").then((value) => {
  if (value != null) {
    setBackground(URL.createObjectURL(value));
  }
});

const BackgroundWrapper: ParentComponent = (props) => {
  const [settings] = useContext(SettingsContext);

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

        // prevent page scrolling when sidebar is open
        "min-height": showSidebar() ? "" : "100%",
        "overflow-y": showSidebar() ? "hidden" : "visible",
        height: showSidebar() ? "100%" : "",
      }}
    >
      {props.children}
    </div>
  );
};

export default BackgroundWrapper;
