import type * as stylex from "@stylexjs/stylex";
import type { JSX } from "@solidjs/web";

export interface StyleProps {
  xstyle?: stylex.StyleXStyles;
  class?: string;
  style?: JSX.CSSProperties | string;
}

interface StyleAttributes {
  readonly class?: string;
  readonly style?: string;
  readonly "data-style-src"?: string;
}

export function reactiveStyleAttributes(read: () => StyleAttributes): StyleAttributes {
  return {
    get class() {
      return read().class;
    },
    get style() {
      return read().style;
    },
    get "data-style-src"() {
      return read()["data-style-src"];
    },
  };
}
