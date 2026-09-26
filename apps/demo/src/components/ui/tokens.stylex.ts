import * as stylex from "@stylexjs/stylex";

export const colors = stylex.defineVars({
  background: "#fafafa",
  foreground: "#171717",
  muted: "#f5f5f3",
  mutedForeground: "#5f5f5b",
  subtleForeground: "#74746f",
  surface: "#ffffff",
  surfaceForeground: "#171717",
  overlay: "#ffffff",
  overlayForeground: "#171717",
  inverse: "#171717",
  inverseForeground: "#ffffff",
  interactive: "#f0f0ed",
  interactiveForeground: "#171717",
  border: "#e2e2de",
  borderStrong: "#b8b8b1",
  primary: "#171717",
  primaryHover: "#343431",
  primaryForeground: "#ffffff",
  primaryMuted: (): string => `color-mix(in srgb, ${colors.primary} 14%, ${colors.surface})`,
  primaryMutedForeground: (): string => colors.primary,
  primaryBorder: (): string => `color-mix(in srgb, ${colors.primary} 32%, transparent)`,
  danger: "#c83f52",
  dangerHover: "#aa3043",
  dangerForeground: "#ffffff",
  dangerMuted: (): string =>
    `color-mix(in srgb, ${colors.dangerMutedForeground} 14%, ${colors.surface})`,
  dangerMutedForeground: "#c83f52",
  dangerBorder: (): string =>
    `color-mix(in srgb, ${colors.dangerMutedForeground} 32%, transparent)`,
  success: (): string => `color-mix(in srgb, ${colors.successForeground} 14%, ${colors.surface})`,
  successForeground: "#1f7a4d",
  successBorder: (): string => `color-mix(in srgb, ${colors.successForeground} 32%, transparent)`,
  warning: (): string => `color-mix(in srgb, ${colors.warningForeground} 14%, ${colors.surface})`,
  warningForeground: "#9a6410",
  warningBorder: (): string => `color-mix(in srgb, ${colors.warningForeground} 32%, transparent)`,
  focus: "#0f766e",
  selection: "#99f6e4",
  selectionForeground: "#134e4a",
  scrollbar: "#a8a8a1",
  scrollbarTrack: "#f3f3f1",
  backdrop: "rgba(15, 15, 14, 0.58)",
});

export const radii = stylex.defineVars({
  base: "0.5rem",
  sm: (): string => `calc(${radii.base} * 0.625)`,
  md: (): string => radii.base,
  lg: (): string => `calc(${radii.base} * 1.5)`,
  full: "999px",
});

export const controls = stylex.defineVars({
  height: "2.75rem",
  heightXs: (): string => `calc(${controls.height} - 0.5rem)`,
  heightSm: (): string => `calc(${controls.height} - 0.25rem)`,
  heightLg: (): string => `calc(${controls.height} + 0.25rem)`,
  touchTarget: "2.75rem",
  disabledOpacity: "0.6",
  focusWidth: "2px",
  focusOffset: "2px",
});

export const typography = stylex.defineVars({
  sans: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace',
  caption: "0.6875rem",
  xs: "0.75rem",
  sm: "0.8125rem",
  md: "0.875rem",
  lg: "1rem",
  medium: "500",
  semibold: "600",
  bold: "650",
  headingLineHeight: "1.3",
  bodyLineHeight: "1.5",
});

export const motion = stylex.defineVars({
  fast: "120ms",
  normal: "180ms",
  easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
});

export const shadows = stylex.defineVars({
  sm: "0 1px 2px rgba(24, 21, 31, 0.08)",
  md: "0 18px 50px rgba(20, 20, 18, 0.14)",
  lg: "0 30px 90px rgba(20, 20, 18, 0.2)",
});
