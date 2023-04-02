import { BiRegularChevronsRight } from "solid-icons/bi";
import {
  Component,
  createMemo,
  createResource,
  createSignal,
  useContext,
} from "solid-js";
import BackgroundPicker from "./BackgroundPicker";
import { SettingsContext } from "./settings";
import { useParams } from "@solidjs/router";
import { getBookmarkPath, getBookmarkTitle } from "./utils";

export const [showSidebar, setShowSidebar] = createSignal<boolean>();

export const Sidebar: Component = () => {
  const params = useParams<{ id: string }>();
  const [settings, setSettings] = useContext(SettingsContext);
  const [defaultPath] = createResource(
    () => settings.defaultFolder,
    async (defaultFolder) =>
      (await getBookmarkPath(defaultFolder)).map(getBookmarkTitle).join(" / "),
    { initialValue: "" }
  );

  return (
    <>
      <div
        class="sidebar-cover"
        style={{ display: showSidebar() ? "" : "none" }}
        onClick={() => setShowSidebar(false)}
      />
      <div
        class={`sidebar ${
          showSidebar() == null ? "" : showSidebar() ? "show" : "hide"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div class="settings-header-container">
          <div class="button borderless" onClick={() => setShowSidebar(false)}>
            <BiRegularChevronsRight size="28" />
          </div>
          <div
            style={{
              "font-size": "28px",
              "flex-grow": "1",
            }}
          >
            Settings
          </div>
        </div>
        <div style={{ "border-bottom": "solid 1px gray" }} />
        <div class="settings-content-container">
          <div class="settings-section-name">Background</div>
          <BackgroundPicker />
          <div
            style={
              "display: flex; justify-content: space-between; align-items: center; width: 100%"
            }
          >
            <div class="settings-section-name">Default Folder</div>
            <div
              class="button borderless"
              onClick={() => {
                console.log(params.id);
                setSettings({ defaultFolder: params.id });
              }}
            >
              Set Current
            </div>
          </div>
          <div>{defaultPath}</div>
        </div>
      </div>
    </>
  );
};
