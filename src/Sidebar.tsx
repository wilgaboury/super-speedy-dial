import { useParams } from "@solidjs/router";
import {
  BiLogosFirefox,
  BiLogosGithub,
  BiRegularChevronsRight,
  BiSolidMoon,
  BiSolidSun,
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
import { setAllowScroll } from "./Modal";
import { SettingsContext } from "./settings";
import { getBookmarkPath, getBookmarkTitle } from "./utils";
import { openUrlClick } from "./Tile";
import Slider from "./Slider";

const buttonIconSize = 26;

const SettingsSeparator: Component = () => {
  return <div style={{ "border-bottom": "solid 1px gray" }} />;
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
              <div
                class="button borderless"
                onClick={() => {
                  setAllowScroll(true);
                  setShowSidebar(false);
                }}
              >
                <BiRegularChevronsRight size="28" />
              </div>
              <div
                style={{
                  "font-size": "28px",
                  "flex-grow": "1",
                }}
              >
                Settings
              </div>
            </div>
            <div style={{ "border-bottom": "solid 1px gray" }} />
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
                <div
                  class="button borderless"
                  onClick={() => setSettings({ defaultFolder: params.id })}
                >
                  Set Current
                </div>
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
            <div
              class="button borderless"
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
            </div>
            <div
              class="button borderless"
              onClick={(e) =>
                openUrlClick(
                  "https://github.com/wilgaboury/super-speedy-dial",
                  e.ctrlKey
                )
              }
            >
              <BiLogosGithub size={buttonIconSize} />
            </div>
            <div
              class="button borderless"
              onClick={(e) =>
                openUrlClick(
                  "https://addons.mozilla.org/en-US/firefox/addon/super-speedy-dial/",
                  e.ctrlKey
                )
              }
            >
              <BiLogosFirefox size={buttonIconSize} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
