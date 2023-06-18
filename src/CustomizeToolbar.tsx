import { Component, createEffect, createSignal, useContext } from "solid-js";
import { Modal } from "./Modal";
import { SettingsContext } from "./settings";
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
  const [toolbarUnused, setToolbarUnused] = createSignal<ToolbarKind[]>([]);

  createEffect(() => {
    setToolbar([...settings.toolbar]);
    setToolbarUnused([...settings.toolbarUnused]);
  });

  const toolbarLayout = horizontalLayout();
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
            gap: "50px",
          }}
        >
          <Sortable
            context={CustomizeSortableContext}
            each={toolbar()}
            layout={toolbarLayout}
            onMove={(_item, start, end) => {
              console.log("on move");
              setToolbar(move([...toolbar()], start, end));
            }}
            // onInsert={(item, idx) => {
            //   const tmp = [...toolbar()];
            //   tmp.splice(idx, 0, item);
            //   setToolbar(tmp);
            // }}
            // onRemove={(_item, idx) => {
            //   const tmp = [...toolbar()];
            //   tmp.splice(idx, 1);
            //   setToolbar(tmp);
            // }}
          >
            {(props) => (
              <div
                ref={props.itemRef}
                style={{
                  position: "absolute",
                  padding: "10px",
                }}
              >
                <ToolbarButtonIcon kind={props.item} size={30} />
              </div>
            )}
          </Sortable>
          <div style={{ padding: "10px", width: "100%" }}>
            <div>
              <Sortable
                context={CustomizeSortableContext}
                each={toolbarUnused()}
                layout={toolbarUnusedLayout}
                onMove={(_item, start, end) =>
                  setToolbar(move(toolbar(), start, end))
                }
                // onInsert={(item, idx) => {
                //   const tmp = toolbar();
                //   tmp.splice(idx, 0, item);
                //   setToolbar(tmp);
                // }}
                // onRemove={(_item, idx) => {
                //   const tmp = [...toolbar()];
                //   tmp.splice(idx, 1);
                //   setToolbar(tmp);
                // }}
              >
                {(props) => (
                  <div
                    ref={props.itemRef}
                    style={{
                      position: "absolute",
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
          </div>
        </div>
      </Modal>
    </CustomizeSortableContext.Provider>
  );
};

export default CustomizeToolbar;
