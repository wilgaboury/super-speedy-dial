/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import App from "./App";
import { hashIntegration, Router } from "@solidjs/router";

// necessary for custom save/restore scroll logic to work
history.scrollRestoration = "manual";

render(
  () => (
    <Router source={hashIntegration()}>
      <App />
    </Router>
  ),
  document.getElementById("root")!
);
