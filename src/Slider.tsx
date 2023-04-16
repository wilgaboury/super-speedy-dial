import { Component, useContext } from "solid-js";
import { SettingsContext } from "./settings";

interface SliderProps {
  readonly start: number;
  readonly end: number;
  readonly tick: number;
  readonly inc: number;
  readonly value: number;
  readonly onValue: (value: number) => void;
}

const Slider: Component<SliderProps> = (props) => {
  return (
    <div style={{ display: "flex" }}>
      <input
        type="text"
        value={props.value}
        onInput={(e) => {
          const strValue = e.target.value as string;
          const value = parseFloat(strValue);
          if (!isNaN(value) && value >= props.start && value <= props.end) {
            props.onValue(value);
          }
        }}
        style={{ "text-align": "center", width: "100px" }}
      />
      <input
        type="range"
        min={props.start}
        max={props.end}
        value={props.value}
        style={{ "flex-grow": "1" }}
      />
    </div>
  );
};

export default Slider;
