import { HexColorPicker } from "solid-colorful";
import { Component } from "solid-js";
import { settings } from "./settings";

type Selected = "upload" | "previous" | "color";

const BackgroundPicker: Component = () => {
  function backgroundColorInputChanged(e: any) {
    const value = e.target.value as string;
    console.log(value);
    if (value.match(/^#[0-9a-fA-F]{6}$/)) {
      settings.setBackgroundColor(value);
    }
  }
  return (
    <div class="settings-background-container">
      <div class="settings-background-item">
        <input
          type="text"
          value={settings.backgroundColor()}
          onInput={backgroundColorInputChanged}
          style={{ width: "70px", "text-align": "center" }}
        />
        <HexColorPicker
          color={settings.backgroundColor()}
          onChange={(c) => settings.setBackgroundColor(c)}
        />
      </div>
    </div>
  );
};

export default BackgroundPicker;
