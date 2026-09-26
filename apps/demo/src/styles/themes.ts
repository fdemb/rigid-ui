import * as stylex from "@stylexjs/stylex";

import { siteColors } from "./site.stylex";

const lightTheme = stylex.createTheme(siteColors, {});

const darkTheme = stylex.createTheme(siteColors, {
  canvasMuted: "#181817",
  codeBackground: "#0a0a09",
  codeText: "#f1f1ec",
  codeTextMuted: "#b0b0ab",
});

export const siteThemes = {
  light: lightTheme,
  dark: darkTheme,
};
