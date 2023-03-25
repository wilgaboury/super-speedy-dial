import { Outlet, useParams } from "@solidjs/router";
import { Component, createSignal } from "solid-js";
import { getIDBObject } from "./idb";

import defaultBackground from "./assets/default_background.png";

const Folder: Component = () => {
  const params = useParams<{ id: string }>();

  const [background, setBackground] = createSignal<string>();

  getIDBObject<Blob>("background_store", "background").then((value) => {
    if (value == null) {
      setBackground(defaultBackground);
    } else {
      setBackground(URL.createObjectURL(value));
    }
  });

  return (
    <div
      class="background"
      style={
        background() == null
          ? {}
          : { "background-image": `url(${background()})` }
      }
    >
      <Outlet />
    </div>
  );
};

export default Folder;
