import { Component } from "solid-js";
import { Route, Routes } from "@solidjs/router";
import BackgroundWrapper from "./BackgroundWrapper";
import FolderRedirect from "./FolderRedirect";
import { ContextMenu } from "./ContextMenu";
import { Sidebar } from "./Sidebar";
import { SettingsProvider } from "./settings";
import { Folder } from "./Folder";

const App: Component = () => {
  return (
    <SettingsProvider>
      <BackgroundWrapper>
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
        </Routes>
      </BackgroundWrapper>
      <ContextMenu />
    </SettingsProvider>
  );
};

export default App;
