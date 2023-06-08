import { useNavigate, useParams } from "@solidjs/router";
import {
  BiLogosFirefox,
  BiLogosGithub,
  BiRegularChevronsRight,
  BiSolidHelpCircle,
  BiSolidMoon,
  BiSolidSun,
  BiSolidTrash,
} from "solid-icons/bi";
import {
  Component,
  Match,
  Switch,
  createResource,
  createSignal,
  useContext,
} from "solid-js";
import BackgroundPicker from "./BackgroundPicker";
import { Modal, setAllowScroll } from "./Modal";
import { SettingsContext } from "./settings";
import Slider from "./Slider";
import { getBookmarkPath, getBookmarkTitle } from "./utils/bookmark";
import { openUrlClick } from "./utils/assorted";
import { getDb, tileImageStore } from "./utils/database";
import Help from "./Help";

const buttonIconSize = 24;

const SettingsSeparator: Component = () => {
  return <div style={{ "border-bottom": "solid 1px var(--text-color)" }} />;
};

export const [showSidebar, setShowSidebar] = createSignal<boolean | null>();

export const Sidebar: Component = () => {
  const params = useParams<{ id: string }>();
  const [settings, setSettings] = useContext(SettingsContext);
  const [defaultPath] = createResource(
    () => settings.defaultFolder,
    async (defaultFolder) =>
      (await getBookmarkPath(defaultFolder)).map(getBookmarkTitle).join(" / "),
    { initialValue: "" }
  );

  const [showTrashConfirm, setShowTrashConfim] = createSignal(false);

  async function trashImageCache() {
    await (await getDb()).clearAll(tileImageStore);
    location.reload();
  }

  const [showHelp, setShowHelp] = createSignal(false);

  const navigate = useNavigate();

  return (
    <>
      <div
        class="sidebar-cover"
        style={{ display: showSidebar() ? "" : "none" }}
        onClick={() => {
          setAllowScroll(true);
          setShowSidebar(false);
        }}
      />
      <div
        class={`sidebar ${
          showSidebar() == null ? "" : showSidebar() ? "show" : "hide"
        }`}
        onClick={(e) => e.stopPropagation()}
        onAnimationEnd={() => {
          if (!showSidebar()) setShowSidebar(null);
        }}
      >
        <div class="settings-container">
          <div style={{ width: "100%" }}>
            <div class="settings-header-container">
              <button
                class="borderless"
                onClick={() => {
                  setAllowScroll(true);
                  setShowSidebar(false);
                }}
              >
                <BiRegularChevronsRight size="28" />
              </button>
              <div
                style={{
                  "font-size": "28px",
                  "flex-grow": "1",
                }}
              >
                Settings
              </div>
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
            </div>
          </div>
          <div class="settings-button-container">
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
            <button
              class="borderless"
              onClick={(e) =>
                openUrlClick(
                  "https://github.com/wilgaboury/super-speedy-dial",
                  e.ctrlKey
                )
              }
            >
              <BiLogosGithub size={buttonIconSize} />
            </button>
            <button
              class="borderless"
              onClick={(e) =>
                openUrlClick(
                  "https://addons.mozilla.org/en-US/firefox/addon/super-speedy-dial/",
                  e.ctrlKey
                )
              }
            >
              <BiLogosFirefox size={buttonIconSize} />
            </button>
            <button class="borderless" onClick={() => setShowTrashConfim(true)}>
              <BiSolidTrash size={buttonIconSize} />
              <Modal
                show={showTrashConfirm()}
                onClose={() => setShowTrashConfim(false)}
              >
                <div class="modal-content" style={{ "max-width": "550px" }}>
                  Confirm you would like to delete all cached tile images
                </div>
                <div class="modal-separator" />
                <div class="modal-buttons">
                  <button class="delete" onClick={trashImageCache}>
                    Delete
                  </button>
                  <button onClick={() => setShowTrashConfim(false)}>
                    Cancel
                  </button>
                </div>
              </Modal>
            </button>
            <button
              class="borderless"
              onClick={() => {
                // navigate("/help");
                setShowHelp(true);
              }}
            >
              <BiSolidHelpCircle size={buttonIconSize} />
              <Modal
                show={showHelp()}
                onClose={() => setShowHelp(false)}
                closeOnBackgruondClick
              >
                <div onmousedown={(e) => e.stopImmediatePropagation()}>
                  <div class="modal-content" style={{ "max-width": "750px" }}>
                    <Help />
                  </div>
                  <div class="modal-separator" />
                  <div class="modal-buttons">
                    <button onClick={() => setShowHelp(false)}>Close</button>
                  </div>
                </div>
              </Modal>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
