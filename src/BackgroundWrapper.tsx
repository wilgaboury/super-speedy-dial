import { ParentComponent } from "solid-js";
import { createSignal } from "solid-js";
import { getIDBObject } from "./idb";
import defaultBackground from "./assets/default_background.png";

export const [background, setBackground] = createSignal<string>();

getIDBObject<Blob>("background_store", "background").then((value) => {
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
      style={
        background() == null
          ? {}
          : { "background-image": `url(${background()})` }
      }
    >
      {props.children}
    </div>
  );
};

export default BackgroundWrapper;
