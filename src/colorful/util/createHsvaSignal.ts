import { Accessor, createEffect, createMemo, createSignal } from "solid-js";
import { equalColorObjects } from "./compare";
import { AnyColor, ColorModel, HsvaColor } from "./types";

export function createColorSignal<T extends AnyColor>(
  model: Accessor<ColorModel<T>>,
  rawColor: Accessor<T | undefined>,
  setColor: Accessor<((color: T) => void) | undefined>
): [Accessor<HsvaColor>, (color: Partial<HsvaColor>) => void] {
  const color: Accessor<T> = createMemo(
    () => rawColor() ?? model().defaultColor
  );
  const toHsva = () => model().toHsva(color());
  const [hsva, setHsva] = createSignal(toHsva());

  let cacheColor = color();
  let cacheHsva = hsva();

  createEffect(() => {
    if (!model().equal(color(), cacheColor)) {
      const newHsva = toHsva();
      cacheHsva = newHsva;
      setHsva(newHsva);
    }
  });

  const setHsvaPartial = (hsva: Partial<HsvaColor>) =>
    setHsva((prev) => Object.assign({}, prev, hsva));

  createEffect(() => {
    const set = setColor();
    let newColor;
    if (
      set != null &&
      !equalColorObjects(hsva(), cacheHsva) &&
      !model().equal((newColor = model().fromHsva(hsva())), cacheColor)
    ) {
      cacheColor = newColor;
      set(newColor);
    }
  });
  return [hsva, setHsvaPartial];
}
