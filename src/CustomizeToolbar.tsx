import { Component } from "solid-js";
import { Modal } from "./Modal";

interface CustomizeToolbarProps {
  readonly show: boolean;
  readonly onClose?: () => void;
}

const CustomizeToolbar: Component<CustomizeToolbarProps> = (props) => {
  return (
    <Modal show={props.show} onClose={props.onClose}>
      <></>
    </Modal>
  );
};

export default CustomizeToolbar;
