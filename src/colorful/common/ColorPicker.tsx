import { createColorSignal } from "../util/createHsvaSignal";
import { AnyColor, ColorModel, ColorPickerBaseProps } from "../util/types";
import Hue from "./Hue";
import Saturation from "./Saturation";

interface ColorPickerProps<T extends AnyColor> extends ColorPickerBaseProps<T> {
  readonly class?: string;
  readonly colorModel: ColorModel<T>;
}

function ColorPicker<T extends AnyColor>(props: ColorPickerProps<T>) {
  let nodeRef: HTMLDivElement | undefined;

  const [hsva, setHsva] = createColorSignal(
    () => props.colorModel,
    () => props.color,
    () => props.setColor
  );

  return (
    <div ref={nodeRef} class={`solid-colorful ${props.class}`}>
      <Saturation hsva={hsva()} setHsva={setHsva} />
      <Hue
        hue={hsva().h}
        setHsva={setHsva}
        class="solid-colorful__last-control"
      />
    </div>
  );
}

export default ColorPicker;
