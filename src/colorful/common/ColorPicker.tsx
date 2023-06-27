import { AnyColor, ColorModel, ColorPickerBaseProps } from "../types";

interface ColorPickerProps<T extends AnyColor>
  extends Partial<ColorPickerBaseProps<T>> {
  colorModel: ColorModel<T>;
}

function ColorPicker<T extends AnyColor>(props: ColorPickerProps<T>) {
  let nodeRef: HTMLDivElement | undefined;

  const [hsva, updateHsva] = useColorManipulation<T>(
    props.colorModel,
    props.color,
    props.onChange
  );

  return (
    <div ref={nodeRef} class={`react-colorful ${props.class}`}>
      <Saturation hsva={hsva} onChange={updateHsva} />
      <Hue
        hue={hsva.h}
        onChange={updateHsva}
        className="react-colorful__last-control"
      />
    </div>
  );
}
