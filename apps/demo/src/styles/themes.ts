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
  backdrop: "rgba(4, 4, 3, 0.74)",
  shadowSm: "0 1px 2px rgba(0, 0, 0, 0.28)",
  shadowMd: "0 18px 54px rgba(0, 0, 0, 0.38)",
  shadowLg: "0 32px 90px rgba(0, 0, 0, 0.5)",
});

export const groveTheme = stylex.createTheme(tokens, {
  canvas: "#f0f6ef",
  canvasMuted: "#e3eee1",
  surface: "#fbfdf9",
  surfaceRaised: "#ffffff",
  surfaceSunken: "#edf4ec",
  surfaceInteractive: "#e8f2e5",
  text: "#17201a",
  textMuted: "#59685d",
  textSubtle: "#647166",
  border: "#cbd9c8",
  borderStrong: "#99ae96",
  accent: "#227a4e",
  accentHover: "#155f3b",
  accentText: "#ffffff",
  danger: "#b84242",
  dangerHover: "#983434",
  dangerText: "#ffffff",
  success: "#1d7048",
  warning: "#8a5c12",
  focus: "#25845a",
  codeBackground: "#15241a",
  codeText: "#e8f5e9",
  backdrop: "rgba(15, 32, 21, 0.48)",
  shadowSm: "0 1px 2px rgba(23, 48, 31, 0.08)",
  shadowMd: "0 16px 48px rgba(23, 48, 31, 0.14)",
  shadowLg: "0 28px 80px rgba(23, 48, 31, 0.18)",
});

export type ThemeName = "light" | "dark" | "grove";

export const themes = {
  light: lightTheme,
  dark: darkTheme,
  grove: groveTheme,
} satisfies Record<ThemeName, stylex.Theme<typeof tokens>>;
