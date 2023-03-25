import { useNavigate } from "@solidjs/router";
import { Component } from "solid-js";
import { getStartFolder } from "./utils";
import browser from "webextension-polyfill";

const FolderRedirect: Component = () => {
  const navigate = useNavigate();

  getStartFolder().then((bookmark) => {
    navigate(`/folder/${bookmark.id}`);
  });

  return <></>;
};

export default FolderRedirect;
