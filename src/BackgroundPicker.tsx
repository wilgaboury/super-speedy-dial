import { HexColorPicker } from "solid-colorful";
import {
  BiRegularCircle,
  BiRegularPlus,
  BiSolidCheckCircle,
} from "solid-icons/bi";
import {
  Component,
  Show,
  createEffect,
  createMemo,
  createSignal,
  onMount,
  useContext,
} from "solid-js";
import {
  backgroundKey,
  setAdHocBackground,
  storedBackground,
  storedBackgroundUrl,
} from "./BackgroundWrapper";
import {
  StorageDatabase,
  backgroundImageStore,
  dbSet,
  isUsingIdb,
} from "./utils/database";
import { SettingsContext } from "./settings";
import { scaleDown, blobToImage } from "./utils/image";
import { onEnterKeyDown } from "./utils/assorted";

type Selected = "upload" | "previous" | "color";

interface SelectedButtonProps {
  readonly selected: boolean;
  readonly onSelected?: () => void;
  readonly button?: boolean;
}

const SelectedButton: Component<SelectedButtonProps> = (props) => {
  function onSelected() {
    if (props.onSelected != null) props.onSelected();
  }
  return (
    <div
      tabIndex={props.button == null || props.button ? 0 : -1} // allow focusing
      class={props.button == null || props.button ? "button borderless" : ""}
      onClick={onSelected}
      onKeyDown={onEnterKeyDown(onSelected)}
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
  const uploadUrl = createMemo(() => {
    const u = upload();
    if (u != null) return URL.createObjectURL(u);
  });

  const [strColorValue, setStrColorValue] = createSignal(
    settings.backgroundColor
  );
  createEffect(() => setStrColorValue(settings.backgroundColor));

  function isValidColor(value: string) {
    return value.match(/^#[0-9a-fA-F]{6}$/) != null;
  }

  function backgroundColorInputChanged(e: any) {
    const value = e.target.value as string;
    setStrColorValue(value);
    if (isValidColor(value)) setSettings({ backgroundColor: value });
  }

  function setUploadSelected() {
    const u = upload();
    if (u == null) return;
    setAdHocBackground(u);
    setSettings({ useBackgroundColor: false });
    setSelected("upload");
    dbSet(backgroundImageStore, backgroundKey, u);
    isUsingIdb().then((isIdb) => {
      if (isIdb) StorageDatabase().set(backgroundImageStore, backgroundKey, u);
    });
  }

  function setPreviousSelected() {
    const p = storedBackground();
    if (p == null) return;
    setAdHocBackground(undefined);
    setSettings({ useBackgroundColor: false });
    setSelected("previous");
    dbSet(backgroundImageStore, backgroundKey, p);
    isUsingIdb().then((isIdb) => {
      if (isIdb) StorageDatabase().set(backgroundImageStore, backgroundKey, p);
    });
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
    const uploadChangeListener = (el: HTMLInputElement) => async () => {
      const u = await blobToImage(el?.files?.item(0));
      if (u == null) return;
      const uScaled = await scaleDown(u, 2560);
      setUpload(uScaled.blob);
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
            <div class="center-content">Upload...</div>
          </label>
        </div>
        <Show
          when={uploadUrl()}
          fallback={
            <label
              class="button center-content"
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
                "background-size": "cover",
                "background-image": `url(${nnUpload()})`,
                "border-radius": "10px",
                "background-position": "center",
              }}
              onClick={setUploadSelected}
            />
          )}
        </Show>
      </div>
      <Show when={storedBackgroundUrl()}>
        {(nnPrevious) => (
          <div class="settings-background-item">
            <button
              class="settings-background-item-header borderless"
              onClick={setPreviousSelected}
            >
              <SelectedButton
                selected={selected() == "previous"}
                button={false}
              />
              <div style={{ "text-align": "center", "flex-grow": "1" }}>
                <div class="center-content">Previous</div>
              </div>
            </button>
            <div
              class={`${
                selected() == "previous" ? "settings-background-selected" : ""
              }`}
              style={{
                "flex-grow": "1",
                "background-size": "cover",
                "background-image": `url(${nnPrevious()})`,
                "border-radius": "10px",
                "background-position": "center",
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
            class={`default ${isValidColor(strColorValue()) ? "" : "error"}`}
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
