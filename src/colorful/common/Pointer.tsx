import { Component } from "solid-js";

interface PointerProps {
  readonly class?: string;
  readonly top?: number;
  readonly left: number;
  readonly color: string;
}

const Pointer: Component<PointerProps> = (props) => {
  return (
    <div
      class={`solid-colorful__pointer ${props.class}`}
      style={{
        top: `${(props.top ?? 0.5) * 100}%`,
        left: `${props.left * 100}%`,
      }}
    >
      <div
        class="solid-colorful__pointer-fill"
        style={{ "background-color": props.color }}
      />
    </div>
  );
};

export default Pointer;
