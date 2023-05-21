import { Component } from "solid-js";
import helpHtml from "./generated/help.html?raw";

const Help: Component = () => {
  return <div style={{ "user-select": "text" }} innerHTML={helpHtml} />;
};

export default Help;
