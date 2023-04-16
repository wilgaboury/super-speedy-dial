import { Component, useContext } from "solid-js";
import { SettingsContext } from "./settings";

interface SliderProps {
  readonly title: string;
  readonly start: number;
  readonly end: number;
  readonly step: number;
  readonly value: number;
  readonly onValue: (value: number) => void;
}

const Slider: Component<SliderProps> = (props) => {
  function onInput(e: InputEvent) {
    const strValue = e.target.value as string;
    const value = parseFloat(strValue);
    if (!isNaN(value) && value >= props.start && value <= props.end) {
      props.onValue(value);
    }
  }

  return (
    <div style={{ display: "flex", gap: "10px" }}>
      <div style={{ width: "80px" }}>
        <div
          style={{
            display: "flex",
            "align-items": "center",
            "justify-content": "flex-start",
            height: "100%",
            width: "100%",
          }}
        >
          {props.title}
        </div>
      </div>
      <input
        type="text"
        value={props.value}
        onInput={onInput}
        style={{ "text-align": "center", width: "75px" }}
      />
      <input
        type="range"
        min={props.start}
        max={props.end}
        value={props.value}
        step={props.step}
        style={{ "flex-grow": "1" }}
        oninput={onInput}
      />
    </div>
  );
};

export default Slider;
