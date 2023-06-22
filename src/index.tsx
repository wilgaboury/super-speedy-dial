/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import App from "./App";
import { hashIntegration, Router } from "@solidjs/router";
import { SettingsProvider } from "./settings";
import { debounce } from "@solid-primitives/scheduled";

// necessary for custom save/restore scroll logic to work
history.scrollRestoration = "manual";

window.addEventListener(
  "scroll",
  debounce(() => history.replaceState({ scroll: window.scrollY }, ""), 100)
);

render(
  () => (
    <Router source={hashIntegration()}>
      <SettingsProvider>
        <App />
      </SettingsProvider>
    </Router>
  ),
  document.getElementById("root")!
);
