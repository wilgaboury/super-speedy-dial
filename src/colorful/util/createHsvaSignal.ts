import { Accessor, createEffect, createSignal } from "solid-js";
import { AnyColor, ColorModel, HsvaColor } from "./types";

export function createColorSignal<T extends AnyColor>(
  model: Accessor<ColorModel<T>>,
  color: Accessor<T | undefined>,
  setColor: Accessor<((color: T) => void) | undefined>
): [Accessor<HsvaColor>, (color: Partial<HsvaColor>) => void] {
  const toHsva = () => model().toHsva(color() ?? model().defaultColor);
  const [hsva, setHsva] = createSignal(toHsva());
  createEffect(() => setHsva(toHsva()));
  const setHsvaPartial = (hsva: Partial<HsvaColor>) =>
    setHsva((prev) => ({ ...prev, ...hsva }));
  createEffect(() => {
    const set = setColor();
    if (set != null) {
      set(model().fromHsva(hsva()));
    }
  });
  return [hsva, setHsvaPartial];
}
