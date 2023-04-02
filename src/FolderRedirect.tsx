import { useNavigate } from "@solidjs/router";
import { Component, useContext } from "solid-js";
import { SettingsContext } from "./settings";

const FolderRedirect: Component = () => {
  const navigate = useNavigate();
  const [settings] = useContext(SettingsContext);
  navigate(`/folder/${settings.defaultFolder}`);
  return <></>;
};

export default FolderRedirect;
