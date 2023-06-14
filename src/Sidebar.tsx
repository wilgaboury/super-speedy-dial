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
          if (!showSidebar()) setShowSidebar(undefined);
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
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
