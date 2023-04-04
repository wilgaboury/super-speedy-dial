import { HexColorPicker } from "solid-colorful";
import {
  Component,
  Show,
  createResource,
  createSignal,
  onMount,
  useContext,
} from "solid-js";
import { SettingsContext } from "./settings";
import { BiRegularCheck, BiRegularSquareRounded } from "solid-icons/bi";
import { backgroundImageStore, dbGet, dbSet } from "./database";
import { backgroundKey, setBackground } from "./BackgroundWrapper";
import { addUrlToBlob } from "./utils";
import { SizedBlob } from "./utils";
import { Blobbed } from "./utils";
import { Urled } from "./utils";

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
  const [selected, setSelected] = createSignal<Selected>(
    settings.useBackgroundColor ? "color" : "previous"
  );

  const [upload, setUpload] = createSignal<Blob | undefined>();
  const [previous] = createResource(() =>
    dbGet<Blob>(backgroundImageStore, backgroundKey)
  );

  function backgroundColorInputChanged(e: any) {
    const value = e.target.value as string;
    if (value.match(/^#[0-9a-fA-F]{6}$/)) {
      setSettings({ backgroundColor: value });
    }
  }

  let uploadButtonRef: HTMLInputElement | undefined;
  onMount(() => {
    const uploadButton = uploadButtonRef!;
    uploadButton.addEventListener("change", () => {
      const file = uploadButton?.files?.item(0);
      if (file != null) {
        setUpload(file);
        setBackground(URL.createObjectURL(file));
        setSettings({ useBackgroundColor: false });
        setSelected("upload");
        dbSet(backgroundImageStore, backgroundKey, file);
      }
    });
  });

  return (
    <div class="settings-background-container">
      <div class="settings-background-item">
        <div class="settings-background-item-header">
          <SelectedButton
            selected={selected() == "upload"}
            onSelected={() => {
              const u = upload();
              if (u != null) {
                setBackground(URL.createObjectURL(u));
                setSettings({ useBackgroundColor: false });
                setSelected("upload");
                dbSet(backgroundImageStore, backgroundKey, u);
              }
            }}
          />
          <label
            class="button borderless"
            style={{ "text-align": "center", "flex-grow": "1" }}
          >
            <input
              type="file"
              accept="image/png, image/jpeg"
              ref={uploadButtonRef}
            />
            <div class="center-text-container">Upload...</div>
          </label>
        </div>
        <Show when={upload()}>
          {(nnUpload) => (
            <div
              style={{
                "flex-grow": "1",
                "background-image": `url(${URL.createObjectURL(nnUpload())})`,
                "border-radius": "10px",
              }}
            />
          )}
        </Show>
      </div>
      <Show when={previous()}>
        {(nnPrevious) => (
          <div class="settings-background-item">
            <div
              class="settings-background-item-header button borderless"
              onClick={() => {
                setBackground(URL.createObjectURL(nnPrevious()));
                setSettings({ useBackgroundColor: false });
                setSelected("previous");
                dbSet(backgroundImageStore, backgroundKey, nnPrevious());
              }}
            >
              <SelectedButton
                selected={selected() == "previous"}
                button={false}
              />
              <div style={{ "text-align": "center", "flex-grow": "1" }}>
                <div class="center-text-container">Previous</div>
              </div>
            </div>
            <div
              style={{
                "flex-grow": "1",
                "background-image": `url(${URL.createObjectURL(nnPrevious())})`,
                "border-radius": "10px",
              }}
            />
          </div>
        )}
      </Show>
      <div class="settings-background-item">
        <div class="settings-background-item-header">
          <SelectedButton
            selected={selected() == "color"}
            onSelected={() => {
              setSelected("color");
              setSettings({ useBackgroundColor: true });
            }}
          />
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
