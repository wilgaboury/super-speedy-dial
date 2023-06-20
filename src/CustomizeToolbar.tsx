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
  const [toolbar, setToolbar] = createSignal<ToolbarKind[]>([]);
  const [toolbarOverflow, setToolbarOverflow] = createSignal<ToolbarKind[]>([]);
  const [toolbarUnused, setToolbarUnused] = createSignal<ToolbarKind[]>([]);

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
          >
            {(props) => (
              <div ref={props.itemRef} style={{ padding: "10px" }}>
                <ToolbarButtonIcon kind={props.item} size={30} />
              </div>
            )}
          </Sortable>
          <div
            style={{
              padding: "10px",
              width: "100%",
              display: "flex",
              gap: "25px",
              "box-sizing": "border-box",
            }}
          >
            <div style={{ "flex-grow": "1" }}>
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
              >
                {(props) => (
                  <div
                    ref={props.itemRef}
                    style={{
                      display: "flex",
                      "flex-direction": "column",
                      "align-items": "center",
                      width: "150px",
                      height: "75px",
                    }}
                  >
                    <ToolbarButtonIcon kind={props.item} size={20} />
                    <div>{toolbarKindDisplayString(props.item)}</div>
                  </div>
                )}
              </Sortable>
            </div>
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
            >
              {(props) => (
                <div
                  ref={props.itemRef}
                  style={{
                    "background-color": "white",
                    display: "flex",
                    gap: "10px",
                    padding: "5px",
                    "border-radius": "5px",
                    "min-width": "100%",
                    "box-sizing": "border-box",
                  }}
                >
                  <ToolbarButtonIcon kind={props.item} size={20} />
                  <div>{toolbarKindDisplayString(props.item)}</div>
                </div>
              )}
            </Sortable>
          </div>
        </div>
      </Modal>
    </CustomizeSortableContext.Provider>
  );
};

export default CustomizeToolbar;
