import * as stylex from "@stylexjs/stylex";
import { colors, shadows } from "./tokens.stylex";

const schemes = stylex.create({
  light: { colorScheme: "light" },
  dark: { colorScheme: "dark" },
});

const lightColors = stylex.createTheme(colors, {});
const lightShadows = stylex.createTheme(shadows, {});

const darkColors = stylex.createTheme(colors, {
  background: "#111110",
  foreground: "#f5f5f0",
  muted: "#151514",
  mutedForeground: "#b1b1aa",
  subtleForeground: "#878780",
  surface: "#191918",
  surfaceForeground: "#f5f5f0",
  overlay: "#20201e",
  overlayForeground: "#f5f5f0",
  inverse: "#f5f5f0",
  inverseForeground: "#191918",
  interactive: "#252523",
  interactiveForeground: "#f5f5f0",
  selectedSurface: "#666660",
  border: "#30302d",
  borderStrong: "#55554f",
  primary: "#f2f2ed",
  primaryHover: "#ffffff",
  primaryForeground: "#171716",
  danger: "#ee687b",
  dangerHover: "#ff8393",
  dangerForeground: "#241017",
  dangerMutedForeground: "#ee687b",
  successForeground: "#5fd39b",
  warningForeground: "#e0b155",
  focus: "#5eead4",
  selection: "#134e4a",
  selectionForeground: "#ccfbf1",
  scrollbar: "#878780",
  scrollbarTrack: "#181817",
  backdrop: "rgba(4, 4, 3, 0.74)",
});

const darkShadows = stylex.createTheme(shadows, {
  sm: "0 1px 2px rgba(0, 0, 0, 0.28)",
  md: "0 18px 54px rgba(0, 0, 0, 0.38)",
  lg: "0 32px 90px rgba(0, 0, 0, 0.5)",
});

export const themes = {
  light: [lightColors, lightShadows, schemes.light],
  dark: [darkColors, darkShadows, schemes.dark],
};

export type ThemeName = keyof typeof themes;
