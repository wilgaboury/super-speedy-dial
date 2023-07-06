import { JSX } from "solid-js";
import ColorPicker from "./common/ColorPicker";
import { equalHex } from "./util/compare";
import { hexToHsva, hsvaToHex } from "./util/convert";
import { ColorModel, ColorPickerBaseProps } from "./util/types";

const colorModel: ColorModel<string> = {
  defaultColor: "000",
  toHsva: hexToHsva,
  fromHsva: ({ h, s, v }) => hsvaToHex({ h, s, v, a: 1 }),
  equal: equalHex,
};

export const HexColorPicker = (
  props: Partial<ColorPickerBaseProps<string>>
): JSX.Element => (
  <ColorPicker
    colorModel={colorModel}
    color={props.color}
    setColor={props.setColor}
  />
);
