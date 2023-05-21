import { Component } from "solid-js";
import helpHtml from "./generated/help.html?raw";

const Help: Component = () => {
  return <div innerHTML={helpHtml} />;
};

export default Help;
