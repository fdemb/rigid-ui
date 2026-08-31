import * as stylex from "@stylexjs/stylex";

import { tokens } from "./tokens.stylex";

export const lightTheme = stylex.createTheme(tokens, {});

export const darkTheme = stylex.createTheme(tokens, {
  canvas: "#0c0a12",
  canvasMuted: "#13101c",
  surface: "#171320",
  surfaceRaised: "#1d1828",
  surfaceSunken: "#110d19",
  surfaceInteractive: "#241e31",
  text: "#f5f1fb",
  textMuted: "#b1a9c0",
  textSubtle: "#81778f",
  border: "#30283f",
  borderStrong: "#514561",
  accent: "#a789ff",
  accentHover: "#bda7ff",
  accentText: "#171020",
  danger: "#ee687b",
  dangerHover: "#ff8393",
  dangerText: "#241017",
  success: "#5fd39b",
  warning: "#e0b155",
  focus: "#ad92ff",
  codeBackground: "#08070c",
  codeText: "#eee8f8",
  backdrop: "rgba(4, 3, 7, 0.72)",
  heroGlow: "rgba(167, 137, 255, 0.2)",
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
  textSubtle: "#7d8b80",
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
  heroGlow: "rgba(34, 122, 78, 0.18)",
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
