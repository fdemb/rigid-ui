import * as stylex from "@stylexjs/stylex";

import { tokens } from "./tokens.stylex";

export const lightTheme = stylex.createTheme(tokens, {});

export const darkTheme = stylex.createTheme(tokens, {
  canvas: "#111110",
  canvasMuted: "#181817",
  surface: "#191918",
  surfaceRaised: "#20201e",
  surfaceSunken: "#151514",
  surfaceInteractive: "#252523",
  text: "#f5f5f0",
  textMuted: "#b1b1aa",
  textSubtle: "#878780",
  border: "#30302d",
  borderStrong: "#55554f",
  accent: "#f2f2ed",
  accentHover: "#ffffff",
  accentText: "#171716",
  danger: "#ee687b",
  dangerHover: "#ff8393",
  dangerText: "#241017",
  success: "#5fd39b",
  warning: "#e0b155",
  focus: "#5eead4",
  codeBackground: "#0a0a09",
  codeText: "#f1f1ec",
  codeTextMuted: "#b0b0ab",
  hatch: "rgba(245, 245, 240, 0.055)",
  backdrop: "rgba(4, 4, 3, 0.74)",
  shadowSm: "0 1px 2px rgba(0, 0, 0, 0.28)",
  shadowMd: "0 18px 54px rgba(0, 0, 0, 0.38)",
  shadowLg: "0 32px 90px rgba(0, 0, 0, 0.5)",
});

export type ThemeName = "light" | "dark";

export const themes = {
  light: lightTheme,
  dark: darkTheme,
} satisfies Record<ThemeName, stylex.Theme<typeof tokens>>;
