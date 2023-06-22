import { useParams } from "@solidjs/router";
import {
  BiRegularChevronsRight,
  BiRegularCodeCurly,
  BiSolidMoon,
  BiSolidSun,
  BiSolidWrench,
} from "solid-icons/bi";
import {
  Component,
  Match,
  Switch,
  createEffect,
  createResource,
  createSignal,
  onCleanup,
  onMount,
  useContext,
} from "solid-js";
import BackgroundPicker from "./BackgroundPicker";
import { SettingsContext } from "./settings";
import Slider from "./Slider";
import { getBookmarkPath, getBookmarkTitle } from "./utils/bookmark";
import { applyFilter, escapeKeyFilter } from "./utils/filter";
import { Modal } from "./Modal";
import { run } from "./utils/assorted";

const buttonIconSize = 26;

const SettingsSeparator: Component = () => {
  return <div style={{ "border-bottom": "solid 1px var(--text-color)" }} />;
};

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

  const keydownListener = applyFilter(escapeKeyFilter)(() =>
    setShowSidebar(false)
  );
  createEffect(() => {
    if (showSidebar()) {
      setTimeout(() => {
        window.addEventListener("keydown", keydownListener);
      });
    }
    onCleanup(() => {
      window.removeEventListener("keydown", keydownListener);
    });
  });

  const [showCustom, setShowCustom] = createSignal(false);
  const [customCss, setCustomCss] = createSignal(settings.customCss);
  let cssEditRef: HTMLDivElement | undefined;

  function apply() {
    setSettings({ customCss: customCss() });
  }

  function keyDownInsertTab(e: KeyboardEvent) {
    if (e.key === "Tab") {
      e.preventDefault();
      document.execCommand("insertHTML", false, "&#009");
    }
  }

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
        onAnimationEnd={() => {
          if (!showSidebar()) setShowSidebar(undefined);
        }}
      >
        <div class="settings-container">
          <div style={{ width: "100%" }}>
            <div class="settings-header-container">
              <button class="borderless" onClick={() => setShowSidebar(false)}>
                <BiRegularChevronsRight size={buttonIconSize} />
              </button>
              <div
                style={{
                  "font-size": "28px",
                  "flex-grow": "1",
                }}
              >
                Settings
              </div>
              <button class="borderless" onClick={() => setShowCustom(true)}>
                <BiRegularCodeCurly size={buttonIconSize} />
              </button>
              <button
                class="borderless"
                onClick={() =>
                  setSettings((s) => ({
                    lightMode: !s.lightMode,
                  }))
                }
              >
                <Switch>
                  <Match when={settings.lightMode}>
                    <BiSolidMoon size={buttonIconSize} />
                  </Match>
                  <Match when={!settings.lightMode}>
                    <BiSolidSun size={buttonIconSize} />
                  </Match>
                </Switch>
              </button>
            </div>
            <SettingsSeparator />
            <div class="settings-content-container">
              <div class="settings-section-name">Background</div>
              <BackgroundPicker />
              <SettingsSeparator />
              <div
                style={
                  "display: flex; justify-content: space-between; align-items: center; width: 100%"
                }
              >
                <div class="settings-section-name">Default Folder</div>
                <button
                  class="borderless"
                  onClick={() => setSettings({ defaultFolder: params.id })}
                >
                  Set Current
                </button>
              </div>
              <div>{defaultPath()}</div>
              <SettingsSeparator />
              <div class="settings-section-name">Customize Sizes</div>
              <Slider
                title={"Width"}
                start={50}
                end={350}
                step={1}
                value={settings.tileWidth}
                onValue={(v) => setSettings({ tileWidth: v })}
              />
              <Slider
                title={"Height"}
                start={50}
                end={350}
                step={1}
                value={settings.tileHeight}
                onValue={(v) => setSettings({ tileHeight: v })}
              />
              <Slider
                title={"Gap"}
                start={10}
                end={80}
                step={1}
                value={settings.tileGap}
                onValue={(v) => setSettings({ tileGap: v })}
              />
              <Slider
                title={"Font"}
                start={5}
                end={30}
                step={1}
                value={settings.tileFont}
                onValue={(v) => setSettings({ tileFont: v })}
              />
              <Slider
                title={"Toolbar"}
                start={10}
                end={40}
                step={1}
                value={settings.toolbarFont}
                onValue={(v) => setSettings({ toolbarFont: v })}
              />
            </div>
          </div>
        </div>
      </div>
      <Modal show={showCustom()} onClose={() => setShowCustom(false)}>
        {run(() => {
          onMount(() => {
            cssEditRef!.innerText = customCss();
          });
          return (
            <div>
              <div class="modal-content" style={{ "font-size": "20px" }}>
                Custom CSS
              </div>
              <div class="modal-separator" />
              <div class="modal-content" style={{ width: "600px" }}>
                <div>
                  Disclaimer: User's are responsible for maintaining any CSS
                  defined here and fixing issues that are cause by it, as
                  identifers, class names, and the structure of the HTML in this
                  extenstion can and will change without notice.
                </div>
                <div>
                  Note: It may be necessary to use <code>!important</code> on
                  some properties in order to override inline styling.
                </div>
                <div
                  ref={cssEditRef}
                  class="custom-code-area"
                  contentEditable
                  onKeyDown={keyDownInsertTab}
                  onInput={() => setCustomCss(cssEditRef?.innerText ?? "")}
                ></div>
              </div>
              <div class="modal-separator" />
              <div class="modal-buttons">
                <button
                  class="save"
                  onClick={() => {
                    apply();
                    setShowCustom(false);
                  }}
                >
                  Save
                </button>
                <button class="save" onClick={apply}>
                  Apply
                </button>
                <button onClick={() => setShowCustom(false)}>Cancel</button>
              </div>
            </div>
          );
        })}
      </Modal>
    </>
  );
};
