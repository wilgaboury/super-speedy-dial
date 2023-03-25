import { ParentComponent } from "solid-js";

const Modal: ParentComponent = (props) => {
  return <div class="modal">{props.children}</div>;
};

export default Modal;
