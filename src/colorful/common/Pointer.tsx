import { Component } from "solid-js";

interface PointerProps {
  class?: string;
  top?: number;
  left: number;
  color: string;
}

const Pointer: Component<PointerProps> = (props) => {
  return (
    <div
      class={`react-colorful__pointer ${props.class}`}
      style={{
        top: `${(props.top ?? 0.5) * 100}%`,
        left: `${props.left * 100}%`,
      }}
    >
      <div
        class="react-colorful__pointer-fill"
        style={{ "background-color": props.color }}
      />
    </div>
  );
};

export default Pointer;
