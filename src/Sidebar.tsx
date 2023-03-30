import { Component, createSignal } from "solid-js";

export const [showSidebar, setShowSidebar] = createSignal(true);

export const Sidebar: Component = () => {
  return (
    <>
      <div
        class="sidebar-cover"
        style={{ display: showSidebar() ? "" : "none" }}
        onClick={() => setShowSidebar(false)}
      />
      <div
        class={`sidebar ${showSidebar() ? "" : "close"}`}
        onClick={(e) => e.stopPropagation()}
      />
    </>
  );
};
