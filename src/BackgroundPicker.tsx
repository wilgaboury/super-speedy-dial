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
import {
  BiRegularCircle,
  BiRegularPlus,
  BiSolidCheckCircle,
} from "solid-icons/bi";
import { backgroundImageStore, dbGet, dbSet } from "./database";
import { backgroundKey, setBackground } from "./BackgroundWrapper";

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
      <Show when={props.selected} fallback={<BiRegularCircle size="24px" />}>
        <BiSolidCheckCircle size="24px" color="#0390fc" />
      </Show>
    </div>
  );
};

const BackgroundPicker: Component = () => {
  const [settings, setSettings] = useContext(SettingsContext);
  const [selected, setSelected] = createSignal<Selected>(
    settings.useBackgroundColor ? "color" : "previous"
  );

  const [upload, setUpload] = createSignal<Blob | undefined | null>();
  const [previous] = createResource(() =>
    dbGet<Blob>(backgroundImageStore, backgroundKey)
  );

  function backgroundColorInputChanged(e: any) {
    const value = e.target.value as string;
    if (value.match(/^#[0-9a-fA-F]{6}$/)) {
      setSettings({ backgroundColor: value });
    }
  }

  function setUploadSelected() {
    const u = upload();
    if (u == null) return;
    setBackground(URL.createObjectURL(u));
    setSettings({ useBackgroundColor: false });
    setSelected("upload");
    dbSet(backgroundImageStore, backgroundKey, u);
  }

  function setPreviousSelected() {
    const p = previous();
    if (p == null) return;
    setBackground(URL.createObjectURL(p));
    setSettings({ useBackgroundColor: false });
    setSelected("previous");
    dbSet(backgroundImageStore, backgroundKey, p);
  }

  function setColorSelected() {
    if (selected() == "color") return;
    setSelected("color");
    setSettings({ useBackgroundColor: true });
  }

  let uploadButtonRef: HTMLInputElement | undefined;
  let uploadBigButtonRef: HTMLInputElement | undefined;
  onMount(() => {
    const uploadButton = uploadButtonRef!;
    const uploadBigButton = uploadBigButtonRef!;
    const uploadChangeListener = (el: HTMLInputElement) => () => {
      setUpload(el?.files?.item(0));
      console.log(upload());
      setUploadSelected();
    };
    uploadButton.addEventListener("change", uploadChangeListener(uploadButton));
    uploadBigButton.addEventListener(
      "change",
      uploadChangeListener(uploadBigButton)
    );
  });

  return (
    <div class="settings-background-container">
      <div class="settings-background-item">
        <div
          class="settings-background-item-header"
          style={{ visibility: upload() == null ? "hidden" : "unset" }}
        >
          <SelectedButton
            selected={selected() == "upload"}
            onSelected={setUploadSelected}
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
        <Show
          when={upload()}
          fallback={
            <label
              class="button center-text-container"
              style={{ "flex-grow": "1", "box-sizing": "border-box" }}
            >
              <BiRegularPlus size="38px" />
              <input
                type="file"
                accept="image/png, image/jpeg"
                ref={uploadBigButtonRef}
              />
            </label>
          }
        >
          {(nnUpload) => (
            <div
              class={`${
                selected() == "upload" ? "settings-background-selected" : ""
              }`}
              style={{
                "flex-grow": "1",
                "background-image": `url(${URL.createObjectURL(nnUpload())})`,
                "border-radius": "10px",
              }}
              onClick={setUploadSelected}
            />
          )}
        </Show>
      </div>
      <Show when={previous()}>
        {(nnPrevious) => (
          <div class="settings-background-item">
            <div
              class="settings-background-item-header button borderless"
              onClick={setPreviousSelected}
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
              class={`${
                selected() == "previous" ? "settings-background-selected" : ""
              }`}
              style={{
                "flex-grow": "1",
                "background-image": `url(${URL.createObjectURL(nnPrevious())})`,
                "border-radius": "10px",
              }}
              onClick={setPreviousSelected}
            />
          </div>
        )}
      </Show>
      <div class="settings-background-item">
        <div class="settings-background-item-header">
          <SelectedButton
            selected={selected() == "color"}
            onSelected={setColorSelected}
          />
          <input
            type="text"
            value={settings.backgroundColor}
            onInput={backgroundColorInputChanged}
            style={{ "text-align": "center", "flex-grow": "1" }}
            onClick={setColorSelected}
          />
        </div>
        <div
          class={`${
            selected() == "color" ? "settings-background-selected" : ""
          }`}
          style={{
            "flex-grow": "1",
            "border-radius": "10px",
          }}
        >
          <HexColorPicker
            color={settings.backgroundColor}
            onChange={(c) => {
              setColorSelected();
              setSettings({ backgroundColor: c });
            }}
            onClick={setColorSelected}
          />
        </div>
      </div>
    </div>
  );
};

export default BackgroundPicker;
