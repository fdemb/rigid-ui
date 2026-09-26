import * as stylex from "@stylexjs/stylex";

export const siteColors = stylex.defineVars({
  canvasMuted: "#f3f3f1",
  codeBackground: "#171717",
  codeText: "#f5f5f1",
  codeTextMuted: "#b6b6b1",
});

export const siteLayout = stylex.defineVars({
  contentWidth: "80rem",
  inset: "clamp(1rem, 2vw, 1.5rem)",
});
