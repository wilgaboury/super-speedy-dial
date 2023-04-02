import { HexColorPicker } from "solid-colorful";
import { Component, useContext } from "solid-js";
import { SettingsContext } from "./settings";

type Selected = "upload" | "previous" | "color";

const BackgroundPicker: Component = () => {
  const [settings, setSettings] = useContext(SettingsContext);

  function backgroundColorInputChanged(e: any) {
    const value = e.target.value as string;
    if (value.match(/^#[0-9a-fA-F]{6}$/)) {
      setSettings({ backgroundColor: value });
    }
  }

  return (
    <div class="settings-background-container">
      <div class="settings-background-item">
        <input
          type="text"
          value={settings.backgroundColor}
          onInput={backgroundColorInputChanged}
          style={{ width: "70px", "text-align": "center" }}
        />
        <HexColorPicker
          color={settings.backgroundColor}
          onChange={(c) => setSettings({ backgroundColor: c })}
        />
      </div>
    </div>
  );
};

export default BackgroundPicker;
