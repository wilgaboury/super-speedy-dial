import { Component } from "solid-js";
import { clamp } from "../../utils/assorted";
import { HsvaColor } from "../util/types";
import Interactive, { Interaction } from "./Interactive";
import { hsvaToHslString } from "../util/convert";
import { round } from "../util/round";
import Pointer from "./Pointer";

interface SaturationProps {
  hsva: HsvaColor;
  setHsva: (newColor: { s: number; v: number }) => void;
}

const Saturation: Component<SaturationProps> = (props) => {
  const handleMove = (interaction: Interaction) => {
    props.setHsva({
      s: interaction.left * 100,
      v: 100 - interaction.top * 100,
    });
  };

  const handleKey = (offset: Interaction) => {
    // Saturation and brightness always fit into [0, 100] range
    props.setHsva({
      s: clamp(props.hsva.s + offset.left * 100, 0, 100),
      v: clamp(props.hsva.v - offset.top * 100, 0, 100),
    });
  };

  return (
    <div
      class="solid-colorful__saturation"
      style={{
        "background-color": hsvaToHslString({
          h: props.hsva.h,
          s: 100,
          v: 100,
          a: 1,
        }),
      }}
    >
      <Interactive
        onMove={handleMove}
        onKey={handleKey}
        aria-label="Color"
        aria-valuetext={`Saturation ${round(props.hsva.s)}%, Brightness ${round(
          props.hsva.v
        )}%`}
      >
        <Pointer
          class="solid-colorful__saturation-pointer"
          top={1 - props.hsva.v / 100}
          left={props.hsva.s / 100}
          color={hsvaToHslString(props.hsva)}
        />
      </Interactive>
    </div>
  );
};

export default Saturation;
