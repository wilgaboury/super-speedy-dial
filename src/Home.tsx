import { useNavigate } from "@solidjs/router";
import { Component } from "solid-js";
import { getStartFolder } from "./utils";

const Home: Component = () => {
  getStartFolder().then((bookmark) => {
    useNavigate()(`/folder/${bookmark.id}`);
  });

  return <></>;
};

export default Home;
