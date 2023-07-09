import { Component, Match, Switch, createSignal, useContext } from "solid-js";
import { FolderSortableItemContext, FolderStateContext } from "./Folder";
import { Modal, ModalProps } from "./Modal";
import { createSegmented } from "./SegmentedControl";

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
        <Segmented.Control choice={page()} onChoice={setPage}>
          <Segmented.Segment key="image">Image</Segmented.Segment>
          <Segmented.Segment key="text">Text</Segmented.Segment>
        </Segmented.Control>
        <Switch>
          <Match when={page() == "image"}>
            <div>Image</div>
          </Match>
          <Match when={page() == "text"}>
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
