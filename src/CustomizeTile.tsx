import { Component, Match, Switch, createSignal, useContext } from "solid-js";
import { FolderSortableItemContext, FolderStateContext } from "./Folder";
import { Modal, ModalProps } from "./Modal";
import { createSegmented } from "./SegmentedControl";
import { BiRegularText, BiSolidImage } from "solid-icons/bi";

type CustomizeTilePage = "image" | "text";

const Segmented = createSegmented<CustomizeTilePage>();

interface CustomizeTileProps extends ModalProps {}

const CustomizeTile: Component<CustomizeTileProps> = (props) => {
  const folderState = useContext(FolderStateContext);
  const folderItem = useContext(FolderSortableItemContext);
  const [page, setPage] = createSignal<CustomizeTilePage>("image");

  return (
    <Modal
      show={props.show}
      onClose={props.onClose}
      closeOnBackgruondClick={props.closeOnBackgruondClick}
    >
      <div class="modal-content" style={{ "max-width": "550px" }}>
        <div style={{ display: "flex", "justify-content": "center" }}>
          <Segmented.Control choice={page()} onChoice={setPage}>
            <Segmented.Segment key="image" style={{ gap: "5px" }}>
              <BiSolidImage size={20} />
              Image
            </Segmented.Segment>
            <Segmented.Segment key="text" style={{ gap: "5px" }}>
              <BiRegularText size={20} />
              Text
            </Segmented.Segment>
          </Segmented.Control>
        </div>
        <Switch>
          <Match when={page() === "image"}>
            <div>Image</div>
          </Match>
          <Match when={page() === "text"}>
            <div>Text</div>
          </Match>
        </Switch>
      </div>
      <div class="modal-separator" />
      <div class="modal-buttons">
        <button class="save" onClick={props.onClose}>
          Save
        </button>
        <button onClick={props.onClose}>Cancel</button>
      </div>
    </Modal>
  );
};

export default CustomizeTile;
