import { BiRegularChevronsRight } from "solid-icons/bi";
import { Component, createSignal } from "solid-js";

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
          showSidebar() == null ? "" : showSidebar() ? "open" : "close"
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
              "margin-left": "10px",
            }}
          >
            Settings
          </div>
        </div>
        <div
          style={{ "border-bottom": "solid 1px gray", margin: "10px 0px" }}
        />
      </div>
    </>
  );
};
