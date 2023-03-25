import { Component } from "solid-js";
import { Route, Router } from "@solidjs/router";
import styles from "./App.module.css";
import Folder from "./Folder";
import Home from "./Home";

const App: Component = () => {
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/folder/:id" component={Folder} />
    </Router>
  );
};

export default App;
