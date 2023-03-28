import { Component } from "solid-js";
import { Route, Routes } from "@solidjs/router";
import Folder from "./Folder";
import BackgroundWrapper from "./BackgroundWrapper";
import FolderRedirect from "./FolderRedirect";
import { ContextMenu } from "./ContextMenu";

const App: Component = () => {
  return (
    <>
      <BackgroundWrapper>
        <Routes>
          <Route path="/" component={FolderRedirect} />
          <Route path="/folder/:id" component={Folder} />
        </Routes>
      </BackgroundWrapper>
      <ContextMenu />{" "}
    </>
  );
};

export default App;
