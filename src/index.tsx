/* @refresh reload */
import { render } from "solid-js/web";

import "./index.css";
import App from "./App";
import { hashIntegration, Router } from "@solidjs/router";

// interface BoxIconProps {
//   type?: "regular" | "solid" | "logo";
//   name?: string; // adjust|alarms|etc....
//   color?: string; //blue|red|etc...
//   size?: string; // xs|sm|md|lg|cssSize
//   rotate?: string; // 90|180|270
//   flip?: "horizontal" | "vertical";
//   border?: "square" | "circle";
//   animation?: string; // spin|tada|etc...
//   pull?: "left" | "right";
// }

// declare module "solid-js" {
//   namespace JSX {
//     interface IntrinsicElements {
//       "box-icon": BoxIconProps;
//     }
//   }
// }

render(
  () => (
    <Router source={hashIntegration()}>
      <App />
    </Router>
  ),
  document.getElementById("root")!
);
