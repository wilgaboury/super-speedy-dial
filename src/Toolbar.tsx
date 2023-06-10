import { Component } from "solid-js";
import { assertExhaustive, run } from "./utils/assorted";
import {
  BiLogosFirefox,
  BiLogosGithub,
  BiRegularMinus,
  BiRegularRefresh,
  BiRegularSearch,
  BiSolidBookmarkPlus,
  BiSolidCog,
  BiSolidFolderPlus,
  BiSolidHelpCircle,
  BiSolidInfoCircle,
  BiSolidWrench,
} from "solid-icons/bi";

export const ToolbarKinds = [
  "search",
  "bookmark",
  "folder",
  "github",
  "firefox",
  "reload",
  "help",
  "about",
  "settings",
  "separator",
  "customize",
] as const;
export type ToolbarKind = (typeof ToolbarKinds)[number];
export const ToolbarKindsSet = new Set<string>(ToolbarKinds);

function toolbarKindToDisplay(kind: ToolbarKind): string {
  switch (kind) {
    case "bookmark":
      return "Add folder";
    case "folder":
      return "Add bookmark";
    case "search":
    case "github":
    case "firefox":
    case "reload":
    case "help":
    case "about":
    case "settings":
    case "separator":
    case "customize":
      return kind.charAt(0).toUpperCase + kind.slice(1);
    default:
      return assertExhaustive(kind);
  }
}

const ToolbarButtonIcon: Component<{
  kind: ToolbarKind;
  size: number;
}> = (props) => {
  return (
    <>
      {run(() => {
        const kind = props.kind;
        const size = props.size;
        switch (kind) {
          case "search":
            return <BiRegularSearch size={size} />;
          case "bookmark":
            return <BiSolidBookmarkPlus size={size} />;
          case "folder":
            return <BiSolidFolderPlus size={size} />;
          case "github":
            return <BiLogosGithub size={size} />;
          case "firefox":
            return <BiLogosFirefox size={size} />;
          case "reload":
            return <BiRegularRefresh size={size} />;
          case "help":
            return <BiSolidHelpCircle size={size} />;
          case "about":
            return <BiSolidInfoCircle size={size} />;
          case "settings":
            return <BiSolidCog size={size} />;
          case "separator":
            return <BiRegularMinus size={size} />;
          case "customize":
            return <BiSolidWrench size={size} />;
          default:
            return assertExhaustive(kind);
        }
      })}
    </>
  );
};
