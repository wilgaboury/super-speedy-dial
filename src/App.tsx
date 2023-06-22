import { Component, Show, useContext } from "solid-js";
import { Route, Routes } from "@solidjs/router";
import BackgroundWrapper from "./BackgroundWrapper";
import FolderRedirect from "./FolderRedirect";
import { ContextMenu } from "./ContextMenu";
import { Sidebar } from "./Sidebar";
import { SettingsContext } from "./settings";
import { Folder } from "./Folder";
import HelpPage from "./HelpPage";
import ConsentModal from "./ConsentModal";

const App: Component = () => {
  const [settings] = useContext(SettingsContext);
  return (
    <>
      <BackgroundWrapper>
        <Show when={settings.consent}>
          <Routes>
            <Route path="/" component={FolderRedirect} />
            <Route
              path="/folder/:id"
              component={() => (
                <>
                  <Folder />
                  <Sidebar />
                </>
              )}
            />
            <Route path="/help" component={HelpPage} />
          </Routes>
        </Show>
        <ConsentModal />
      </BackgroundWrapper>
      <ContextMenu />
    </>
  );
};

export default App;
