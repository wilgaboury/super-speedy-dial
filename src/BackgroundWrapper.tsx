import { ParentComponent } from "solid-js";
import { createSignal } from "solid-js";
import defaultBackground from "./assets/default_background.png";
import { backgroundImageStore, dbGet } from "./database";
import { showSidebar } from "./Sidebar";

export const [background, setBackground] = createSignal<string>();

dbGet<Blob>(backgroundImageStore, "current").then((value) => {
  if (value == null) {
    setBackground(defaultBackground);
  } else {
    setBackground(URL.createObjectURL(value));
  }
});

const BackgroundWrapper: ParentComponent = (props) => {
  return (
    <div
      class="background"
      style={{
        "background-image": background() == null ? "" : `url(${background()})`,

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
