import { Component } from "solid-js";
import { clamp } from "../../utils/assorted";
import Interactive, { Interaction } from "./Interactive";
import Pointer from "./Pointer";
import { hsvaToHslString } from "../util/convert";
import { round } from "../util/round";

interface HueProps {
  readonly class?: string;
  readonly hue: number;
  readonly setHsva: (newHue: { h: number }) => void;
}

const Hue: Component<HueProps> = (props) => {
  const handleMove = (interaction: Interaction) => {
    props.setHsva({ h: 360 * interaction.left });
  };

  const handleKey = (offset: Interaction) => {
    // Hue measured in degrees of the color circle ranging from 0 to 360
    props.setHsva({
      h: clamp(props.hue + offset.left * 360, 0, 360),
    });
  };

  return (
    <div class={`solid-colorful__hue ${props.class}`}>
      <Interactive
        onMove={handleMove}
        onKey={handleKey}
        aria-label="Hue"
        aria-valuenow={round(props.hue)}
        aria-valuemax="360"
        aria-valuemin="0"
      >
        <Pointer
          class="solid-colorful__hue-pointer"
          left={props.hue / 360}
          color={hsvaToHslString({ h: props.hue, s: 100, v: 100, a: 1 })}
        />
      </Interactive>
    </div>
  );
};

export default Hue;
