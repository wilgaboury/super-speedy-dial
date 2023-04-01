import { BiRegularChevronsRight } from "solid-icons/bi";
import { Component, createSignal } from "solid-js";
import { HexColorPicker } from "solid-colorful";
import { settings } from "./settings";

export const [showSidebar, setShowSidebar] = createSignal<boolean>();

export const Sidebar: Component = () => {
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
          <div class="settings-background-container">
            <div>
              <HexColorPicker
                color={settings.backgroundColor()}
                onChange={(c) => settings.setBackgroundColor(c)}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
