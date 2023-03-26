/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import App from "./App";
import { hashIntegration, Router } from "@solidjs/router";
import Muuri from "muuri";

// Makes the default muuri layout algorithm run synchronously
Muuri.defaultPacker.destroy();
Muuri.defaultPacker = new Muuri.Packer(0);

render(
  () => (
    <Router source={hashIntegration()}>
      <App />
    </Router>
  ),
  document.getElementById("root")!
);
