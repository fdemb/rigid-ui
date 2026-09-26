import * as stylex from "@stylexjs/stylex";
import { colors, controls, typography } from "./tokens.stylex";

export const base = stylex.create({
  root: {
    backgroundColor: colors.background,
    color: colors.foreground,
    fontFamily: typography.sans,
    lineHeight: typography.bodyLineHeight,
    scrollbarColor: `${colors.scrollbar} transparent`,
    "::selection": {
      backgroundColor: colors.selection,
      color: colors.selectionForeground,
    },
  },
  focusRing: {
    ":focus-visible": {
      outlineColor: colors.focus,
      outlineOffset: controls.focusOffset,
      outlineStyle: "solid",
      outlineWidth: controls.focusWidth,
    },
  },
});
