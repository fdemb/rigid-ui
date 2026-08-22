export function getOffset(
  element: Element | null,
  prop: "margin" | "padding",
  axis: "x" | "y",
): number {
  if (!element) {
    return 0;
  }

  const styles = getComputedStyle(element);
  const propAxis = axis === "x" ? "Inline" : "Block";

  // `parseFloat("")` is NaN, which jsdom produces for every computed style; real browsers always
  // resolve px values here. Coerce non-finite parses to 0 so gesture math stays usable.
  const parse = (value: string | undefined) => parseFloat(value ?? "") || 0;

  // Safari misreports `marginInlineEnd` in RTL.
  // We have to assume the start/end values are symmetrical, which is likely.
  if (axis === "x" && prop === "margin") {
    return parse(styles[`${prop}InlineStart`]) * 2;
  }

  return parse(styles[`${prop}${propAxis}Start`]) + parse(styles[`${prop}${propAxis}End`]);
}
