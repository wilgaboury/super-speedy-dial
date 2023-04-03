import { HexColorPicker } from "solid-colorful";
import { Component, Show, createSignal, useContext } from "solid-js";
import { SettingsContext } from "./settings";
import { BiRegularCheck, BiRegularSquareRounded } from "solid-icons/bi";

type Selected = "upload" | "previous" | "color";

interface SelectedButtonProps {
  readonly selected: boolean;
  readonly onSelected?: () => void;
  readonly button?: boolean;
}

const SelectedButton: Component<SelectedButtonProps> = (props) => {
  return (
    <div
      class={props.button == null || props.button ? "button borderless" : ""}
      onClick={() => {
        if (props.onSelected != null) props.onSelected();
      }}
    >
      <Show
        when={props.selected}
        fallback={<BiRegularSquareRounded size="24px" />}
      >
        <BiRegularCheck size="24px" color="blue" />
      </Show>
    </div>
  );
};

const BackgroundPicker: Component = () => {
  const [settings, setSettings] = useContext(SettingsContext);
  // const [selected, setSelected] = createSignal<Selected>(
  //   settings.useBackgroundColor ? "color" : "previous"
  // );

  function backgroundColorInputChanged(e: any) {
    const value = e.target.value as string;
    if (value.match(/^#[0-9a-fA-F]{6}$/)) {
      setSettings({ backgroundColor: value });
    }
  }

  return (
    <div class="settings-background-container">
      <div class="settings-background-item">
        <div class="settings-background-item-header">
          <SelectedButton selected={false} />
          <label
            class="button borderless"
            style={{ "text-align": "center", "flex-grow": "1" }}
          >
            <input type="file" />
            <div class="center-text-container">Upload...</div>
          </label>
        </div>
      </div>
      <div class="settings-background-item">
        <div class="settings-background-item-header button borderless">
          <SelectedButton selected={false} button={false} />
          <div style={{ "text-align": "center", "flex-grow": "1" }}>
            <div class="center-text-container">Current</div>
          </div>
        </div>
      </div>
      <div class="settings-background-item">
        <div class="settings-background-item-header">
          <SelectedButton selected={true} />
          <input
            type="text"
            value={settings.backgroundColor}
            onInput={backgroundColorInputChanged}
            style={{ "text-align": "center", "flex-grow": "1" }}
          />
        </div>
        <HexColorPicker
          color={settings.backgroundColor}
          onChange={(c) => setSettings({ backgroundColor: c })}
        />
      </div>
    </div>
  );
};

export default BackgroundPicker;
