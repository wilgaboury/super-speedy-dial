import {
  Component,
  For,
  createEffect,
  createMemo,
  createSignal,
} from "solid-js";
import { Modal } from "./Modal";
import { Bookmarks } from "webextension-polyfill";
import fuzzysort from "fuzzysort";
import { getSubTreeAsList, mod, rootFolderId } from "./utils";
import { BiRegularX } from "solid-icons/bi";
import { openUrl, openUrlClick, openUrlNewTab } from "./Tile";

interface SearchProps {
  readonly show: boolean;
  readonly onClose: () => void;
}

const maxResults = 20;

const Search: Component<SearchProps> = (props) => {
  const [nodes, setNodes] = createSignal<Bookmarks.BookmarkTreeNode[]>([]);
  const [text, setText] = createSignal("");
  const [selected, setSelected] = createSignal(0);

  const results = createMemo(() =>
    fuzzysort.go(text(), nodes(), { key: "title" })
  );

  let inputRef: HTMLInputElement | undefined;

  createEffect(() => {
    if (props.show) {
      getSubTreeAsList(rootFolderId).then(setNodes);
      const input = inputRef!;
      input.focus();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key == "Escape") props.onClose();
  });

  function moveUp() {
    setSelected((i) => mod(i - 1, Math.min(results().length, maxResults)));
  }

  function moveDown() {
    setSelected((i) => mod(i + 1, Math.min(results().length, maxResults)));
  }

  return (
    <Modal show={props.show}>
      <div
        style={{
          width: "500px",
          display: "flex",
          "flex-direction": "column",
          "justify-content": "stretch",
          padding: "5px",
        }}
        onkeydown={(e) => {
          if (e.key == "ArrowUp") moveUp();
          else if (e.key == "ArrowDown") moveDown();
          else if (e.key == "Tab") {
            e.preventDefault();
            if (e.shiftKey) moveUp();
            else moveDown();
          } else if (e.key == "Enter") {
            const url = results()[selected()].obj.url;
            if (e.ctrlKey) openUrlNewTab(url);
            else openUrl(url);
          }
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "5px",
            "margin-bottom": results().length > 0 ? "5px" : "",
          }}
        >
          <input
            ref={inputRef}
            placeholder=" search"
            type="text"
            value={text()}
            onInput={(e) => {
              setSelected(0);
              setText(e.target.value);
            }}
            style={{ "flex-grow": "1" }}
          />
          <div class="button borderless" onClick={() => props.onClose()}>
            <BiRegularX size={20} />
          </div>
        </div>

        <For each={results().slice(0, maxResults)}>
          {(result, idx) => (
            <div
              class={`search-item ${selected() == idx() ? "selected" : ""}`}
              onclick={(e) => {
                const url = results()[selected()].obj.url;
                if (e.ctrlKey) openUrlNewTab(url);
                else openUrl(url);
              }}
            >
              {fuzzysort.highlight(result, (m) => (
                <b>{m}</b>
              ))}
            </div>
          )}
        </For>
      </div>
    </Modal>
  );
};

export default Search;
