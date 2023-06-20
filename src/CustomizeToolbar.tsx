import { Component, createEffect, createSignal, useContext } from "solid-js";
import { Modal } from "./Modal";
import { SettingsContext } from "./settings";
import {
  ToolbarButtonIcon,
  ToolbarKind,
  toolbarKindDisplayString,
} from "./Toolbar";
import {
  HorizonalDirection,
  Sortable,
  VerticalDirection,
  createSortableContext,
  createSortableContextValue,
  flowGridLayout,
  linearLayout,
} from "./Sortable";
import { move } from "./utils/assorted";

interface CustomizeToolbarProps {
  readonly show: boolean;
  readonly onClose?: () => void;
}

const CustomizeSortableContext = createSortableContext<ToolbarKind>();

const CustomizeToolbar: Component<CustomizeToolbarProps> = (props) => {
  const [settings, setSettings] = useContext(SettingsContext);
  const [toolbar, setToolbar] = createSignal<ToolbarKind[]>([
    ...settings.toolbar,
  ]);
  const [toolbarOverflow, setToolbarOverflow] = createSignal<ToolbarKind[]>([
    ...settings.toolbarOverflow,
  ]);
  const [toolbarUnused, setToolbarUnused] = createSignal<ToolbarKind[]>([
    ...settings.toolbarUnused,
  ]);

  createEffect(() => {
    if (props.show) {
      setToolbar([...settings.toolbar]);
      setToolbarOverflow([...settings.toolbarOverflow]);
      setToolbarUnused([...settings.toolbarUnused]);
    }
  });

  const toolbarLayout = linearLayout(HorizonalDirection);
  const toolbarOverflowLayout = linearLayout(VerticalDirection);
  const toolbarUnusedLayout = flowGridLayout();

  const contextValue = createSortableContextValue<ToolbarKind>();

  return (
    <CustomizeSortableContext.Provider value={contextValue}>
      <Modal show={props.show} onClose={props.onClose}>
        <div
          style={{
            display: "flex",
            "flex-direction": "column",
            "align-items": "center",
            width: "500px",
            "max-width": "1000px",
            gap: "25px",
            padding: "10px",
          }}
        >
          <div
            style={{
              "background-color": "var(--background)",
              "border-radius": "5px",
            }}
          >
            <Sortable
              context={CustomizeSortableContext}
              each={toolbar()}
              layout={toolbarLayout}
              onMove={(_item, start, end) =>
                setToolbar(move([...toolbar()], start, end))
              }
              onInsert={(item, idx) => {
                const tmp = [...toolbar()];
                tmp.splice(idx, 0, item);
                setToolbar(tmp);
              }}
              onRemove={(_item, idx) => {
                const tmp = [...toolbar()];
                tmp.splice(idx, 1);
                setToolbar(tmp);
              }}
              fallback={
                <div
                  class="center-content"
                  style={{ width: "150px", height: "50px" }}
                >
                  empty
                </div>
              }
            >
              {(props) => (
                <div
                  ref={props.itemRef}
                  class={`${props.isMouseDown() ? "selected-shadow" : ""}`}
                  style={{
                    padding: "10px",
                    "border-radius": "5px",
                    "background-color": props.isMouseDown()
                      ? "var(--background)"
                      : "",
                  }}
                >
                  <ToolbarButtonIcon kind={props.item} size={30} />
                </div>
              )}
            </Sortable>
          </div>
          <div
            style={{
              width: "100%",
              display: "flex",
              gap: "25px",
              "box-sizing": "border-box",
              "align-items": "start",
            }}
          >
            <div
              style={{
                "flex-grow": "1",
                border: "2px dashed var(--text-color)",
                "border-radius": "5px",
              }}
            >
              <Sortable
                context={CustomizeSortableContext}
                each={toolbarUnused()}
                layout={toolbarUnusedLayout}
                onMove={(_item, start, end) =>
                  setToolbarUnused(move([...toolbarUnused()], start, end))
                }
                onInsert={(item, idx) => {
                  const tmp = [...toolbarUnused()];
                  tmp.splice(idx, 0, item);
                  setToolbarUnused(tmp);
                }}
                onRemove={(_item, idx) => {
                  const tmp = [...toolbarUnused()];
                  tmp.splice(idx, 1);
                  setToolbarUnused(tmp);
                }}
                fallback={
                  <div
                    class="center-content"
                    style={{ width: "100%", height: "100px" }}
                  >
                    empty
                  </div>
                }
              >
                {(props) => (
                  <div
                    ref={props.itemRef}
                    class={`${props.isMouseDown() ? "selected-shadow" : ""}`}
                    style={{
                      display: "flex",
                      "flex-direction": "column",
                      "align-items": "center",
                      width: "100px",
                      padding: "10px",
                      "border-radius": "5px",
                      "background-color": props.isMouseDown()
                        ? "var(--background)"
                        : "",
                    }}
                  >
                    <ToolbarButtonIcon kind={props.item} size={20} />
                    <div style={{ "text-align": "center" }}>
                      {toolbarKindDisplayString(props.item)}
                    </div>
                  </div>
                )}
              </Sortable>
            </div>
            <div
              style={{
                "background-color": "var(--background)",
                "border-radius": "5px",
              }}
            >
              <Sortable
                context={CustomizeSortableContext}
                each={toolbarOverflow()}
                layout={toolbarOverflowLayout}
                onMove={(_item, start, end) =>
                  setToolbarOverflow(move([...toolbarOverflow()], start, end))
                }
                onInsert={(item, idx) => {
                  const tmp = [...toolbarOverflow()];
                  tmp.splice(idx, 0, item);
                  setToolbarOverflow(tmp);
                }}
                onRemove={(_item, idx) => {
                  const tmp = [...toolbarOverflow()];
                  tmp.splice(idx, 1);
                  setToolbarOverflow(tmp);
                }}
                fallback={
                  <div
                    class="center-content"
                    style={{ width: "100px", height: "150px" }}
                  >
                    empty
                  </div>
                }
              >
                {(props) => (
                  <div
                    ref={props.itemRef}
                    class={`${props.isMouseDown() ? "selected-shadow" : ""}`}
                    style={{
                      "box-sizing": "border-box",
                      display: "flex",
                      gap: "10px",
                      padding: "5px",
                      "border-radius": "5px",
                      "background-color": props.isMouseDown()
                        ? "var(--background)"
                        : "",
                      "min-width": props.isMouseDown() ? "100%" : "",
                    }}
                  >
                    <ToolbarButtonIcon kind={props.item} size={20} />
                    <div style={{ "white-space": "nowrap" }}>
                      {toolbarKindDisplayString(props.item)}
                    </div>
                  </div>
                )}
              </Sortable>
            </div>
          </div>
        </div>
        <div class="modal-separator" />
        <div class="modal-buttons">
          {/* <button class="save" onClick={props.onClose}>
            Save
          </button> */}
          <button onClick={props.onClose}>Cancel</button>
        </div>
      </Modal>
    </CustomizeSortableContext.Provider>
  );
};

export default CustomizeToolbar;
