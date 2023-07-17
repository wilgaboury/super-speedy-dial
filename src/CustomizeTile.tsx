import {
  Component,
  Match,
  Switch,
  createMemo,
  createSignal,
  useContext,
} from "solid-js";
import { FolderSortableItemContext, FolderStateContext } from "./Folder";
import { Modal, ModalProps } from "./Modal";
import { createSegmented } from "./SegmentedControl";
import { BiRegularText, BiSolidImage } from "solid-icons/bi";
import BackgroundWrapper from "./BackgroundWrapper";
import { bookmarkVisual, isBookmarkVisualMeta } from "./utils/visual";
import { getObjectUrl } from "./utils/assorted";
import { SettingsContext } from "./settings";

type CustomizeTilePage = "image" | "text";

const Segmented = createSegmented<CustomizeTilePage>();

interface CustomizeTileProps extends ModalProps {}

const CustomizeTile: Component<CustomizeTileProps> = (props) => {
  const folderState = useContext(FolderStateContext);
  const folderItem = useContext(FolderSortableItemContext);
  const [visual, setVisual] = bookmarkVisual(folderItem.item.id);
  const image = createMemo(() => {
    const vis = visual();
    if (!isBookmarkVisualMeta(vis)) return undefined;
    if (vis.visual.kind === "text") return undefined;
    const blob = vis.visual.image.blob;
    if (blob == null) return undefined;
    return getObjectUrl(blob);
  });
  const [page, setPage] = createSignal<CustomizeTilePage>("image");
  const [settings] = useContext(SettingsContext);

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
        <BackgroundWrapper
          style={{
            padding: "25px",
            "border-radius": "10px",
            "background-position": "center",
          }}
        >
          <div
            style={{
              "border-radius": "10px",
              width: `${settings.tileWidth}px`,
              height: `${settings.tileHeight}px`,
              "background-color": "var(--button-hover)",
              "background-size": "cover",
            }}
          >
            <img
              src={image()}
              style={{
                "border-radius": "10px",
                height: "100%",
                width: "100%",
                "object-fit": "cover",
              }}
              draggable={false}
            />
          </div>
        </BackgroundWrapper>
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
