import { Component } from "solid-js";
import { Route, Routes } from "@solidjs/router";
import Folder from "./Folder";
import Home from "./FolderRedirect";
import BackgroundWrapper from "./BackgroundWrapper";
import FolderRedirect from "./FolderRedirect";

const App: Component = () => {
  return (
    <BackgroundWrapper>
      <Routes>
        <Route path="/" component={FolderRedirect} />
        <Route path="/folder/:id" component={Folder} />
      </Routes>
    </BackgroundWrapper>
  );
};

export default App;
