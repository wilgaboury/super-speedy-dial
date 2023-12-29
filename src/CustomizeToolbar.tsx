import { Component, createSignal, useContext } from "solid-js";
import { Modal } from "./Modal";
import { SettingsContext, defaultToolbar } from "./settings";
import {
  ToolbarButtonIcon,
  ToolbarKind,
  toolbarKindDisplayString,
} from "./Toolbar";
import {
  Sortable,
  createSortableContext,
  createSortableContextValue,
  flowGridLayout,
  horizontalLayout,
  verticalLayout,
} from "solid-sortable";
import { move } from "./utils/assorted";

interface ToolbarKindRef {
  readonly kind: ToolbarKind;
}

function box(kind: ToolbarKind): ToolbarKindRef {
  return { kind };
}

function unbox(ref: ToolbarKindRef) {
  return ref.kind;
}

interface CustomizeToolbarProps {
  readonly show: boolean;
  readonly onClose?: () => void;
}

const CustomizeSortableContext = createSortableContext<ToolbarKindRef>();

const CustomizeToolbar: Component<CustomizeToolbarProps> = (props) => {
  const [settings, setSettings] = useContext(SettingsContext);
  const [toolbar, setToolbar] = createSignal<ToolbarKindRef[]>(
    settings.toolbar.map(box)
  );
  const [toolbarOverflow, setToolbarOverflow] = createSignal<ToolbarKindRef[]>(
    settings.toolbarOverflow.map(box)
  );
  const [toolbarUnused, setToolbarUnused] = createSignal<ToolbarKindRef[]>(
    settings.toolbarUnused.map(box)
  );

  return (
    <CustomizeSortableContext.Provider
      value={createSortableContextValue<ToolbarKindRef>()}
    >
      <Modal show={props.show} onClose={props.onClose}>
        <div
          style={{
            display: "flex",
            "flex-direction": "column",
            "align-items": "center",
            "min-width": "600px",
            gap: "25px",
            padding: "10px",
          }}
        >
          <div
            style={{
              display: "flex",
              "flex-direction": "column",
              gap: "10px",
              "align-items": "start",
            }}
          >
            <div>Toolbar</div>
            <div style={{ "flex-grow": "1" }}>
              <div
                style={{
                  "background-color": "var(--background)",
                  "border-radius": "5px",
                }}
              >
                <Sortable
                  context={CustomizeSortableContext}
                  each={toolbar()}
                  layout={horizontalLayout}
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
                      class={`${props.isMouseDown() ? "selected-shadow" : ""}`}
                      style={{
                        padding: "10px",
                        "border-radius": "5px",
                        "background-color": props.isMouseDown()
                          ? "var(--background)"
                          : "",
                      }}
                    >
                      <ToolbarButtonIcon kind={props.item.kind} size={30} />
                    </div>
                  )}
                </Sortable>
              </div>
            </div>
          </div>
          <div
            style={{
              width: "100%",
              display: "flex",
              gap: "25px",
              "box-sizing": "border-box",
              "align-items": "stretch",
              "min-height": "150px",
            }}
          >
            <div style={{ "flex-grow": "1" }}>
              <div
                style={{
                  display: "flex",
                  "flex-direction": "column",
                  gap: "10px",
                  "align-items": "start",
                  height: "100%",
                }}
              >
                <div>Unused Items</div>
                <div
                  style={{
                    "flex-grow": "1",
                    border: "2px dashed var(--text-color)",
                    "border-radius": "5px",
                    width: "100%",
                  }}
                >
                  <Sortable
                    context={CustomizeSortableContext}
                    each={toolbarUnused()}
                    layout={flowGridLayout}
                    onMove={(item, start, end) => {
                      if (item.kind === "separator" || end == 0) return;
                      setToolbarUnused(move([...toolbarUnused()], start, end));
                    }}
                    insertFilter={(item) => item.kind !== "customize"}
                    onInsert={(item, idx) => {
                      if (item.kind === "separator")
                        idx = toolbarUnused().length;
                      const tmp = [...toolbarUnused()];
                      tmp.splice(Math.max(1, idx), 0, item);
                      setToolbarUnused(tmp);
                    }}
                    onRemove={(item, idx) => {
                      const tmp = [...toolbarUnused()];
                      tmp.splice(idx, 1);
                      if (
                        item.kind === "separator" &&
                        (tmp.length === 0 || tmp[0].kind !== "separator")
                      ) {
                        tmp.splice(0, 0, { kind: "separator" });
                      }
                      setToolbarUnused(tmp);
                    }}
                    onDragEnd={(item, startIdx, endIdx) => {
                      if (item.kind === "separator") {
                        const first: ToolbarKindRef =
                          toolbarUnused().length > 0 &&
                          toolbarUnused()[0].kind === "separator"
                            ? toolbarUnused()[0]
                            : {
                                kind: "separator",
                              };
                        setToolbarUnused([
                          first,
                          ...toolbarUnused().filter(
                            (ref) => ref.kind !== "separator"
                          ),
                        ]);
                      }
                    }}
                    fallback={
                      <div
                        class="center-content"
                        style={{ width: "100%", height: "100%" }}
                      >
                        empty
                      </div>
                    }
                  >
                    {(props) => (
                      <div
                        class={`${
                          props.isMouseDown() ? "selected-shadow" : ""
                        }`}
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
                        <ToolbarButtonIcon kind={props.item.kind} size={20} />
                        <div style={{ "text-align": "center" }}>
                          {toolbarKindDisplayString(props.item.kind)}
                        </div>
                      </div>
                    )}
                  </Sortable>
                </div>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                "flex-direction": "column",
                gap: "10px",
                "align-items": "start",
              }}
            >
              <div>Dropdown Menu</div>
              <div style={{ "flex-grow": "1" }}>
                <div
                  style={{
                    "background-color": "var(--background)",
                    "border-radius": "5px",
                  }}
                >
                  <Sortable
                    context={CustomizeSortableContext}
                    each={toolbarOverflow()}
                    layout={verticalLayout}
                    onMove={(_item, start, end) =>
                      setToolbarOverflow(
                        move([...toolbarOverflow()], start, end)
                      )
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
                        class={`${
                          props.isMouseDown() ? "selected-shadow" : ""
                        }`}
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
                        <ToolbarButtonIcon kind={props.item.kind} size={20} />
                        <div style={{ "white-space": "nowrap" }}>
                          {toolbarKindDisplayString(props.item.kind)}
                        </div>
                      </div>
                    )}
                  </Sortable>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-separator" />
        <div class="modal-buttons">
          <button
            class="save"
            onClick={() => {
              setSettings({
                toolbar: toolbar().map(unbox),
                toolbarOverflow: toolbarOverflow().map(unbox),
                toolbarUnused: toolbarUnused().map(unbox),
              });

              props.onClose?.();
            }}
          >
            Save
          </button>
          <button
            onClick={() => {
              setToolbar(defaultToolbar.toolbar.map(box));
              setToolbarOverflow(defaultToolbar.toolbarOverflow.map(box));
              setToolbarUnused(defaultToolbar.toolbarUnused.map(box));
            }}
          >
            Default
          </button>
          <button
            onClick={() => {
              setToolbar(settings.toolbar.map(box));
              setToolbarOverflow(settings.toolbarOverflow.map(box));
              setToolbarUnused(settings.toolbarUnused.map(box));
            }}
          >
            Reset
          </button>
          <button onClick={props.onClose}>Cancel</button>
        </div>
      </Modal>
    </CustomizeSortableContext.Provider>
  );
};

export default CustomizeToolbar;
