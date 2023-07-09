import {
  Component,
  Show,
  createEffect,
  createMemo,
  useContext,
} from "solid-js";
import { Route, Routes } from "@solidjs/router";
import BackgroundWrapper from "./BackgroundWrapper";
import FolderRedirect from "./FolderRedirect";
import { ContextMenu } from "./ContextMenu";
import { Sidebar, showSidebar } from "./Sidebar";
import { SettingsContext } from "./settings";
import { Folder } from "./Folder";
import HelpPage from "./HelpPage";
import ConsentModal from "./ConsentModal";
import { isModalShowing } from "./Modal";

const canScroll = createMemo(() => !isModalShowing() && !showSidebar());
createEffect(() => {
  if (canScroll()) {
    document.documentElement.style.overflow = "overlay";
  } else {
    document.documentElement.style.overflow = "hidden";
  }
});

function contentEditableInnerHtmlToString(innerHtml: string): string {
  return innerHtml.includes("<div>")
    ? innerHtml
        .replaceAll(/<div><br><\/div>/g, "\n")
        .replaceAll(/<div>(.*?)(<br>)?<\/div>/g, "$1\n")
    : innerHtml.replace("<br>", "\n");
}

const App: Component = () => {
  const [settings] = useContext(SettingsContext);

  createEffect(() => {
    document.getElementById("custom-css")!.textContent =
      contentEditableInnerHtmlToString(settings.customCss);
  });

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
