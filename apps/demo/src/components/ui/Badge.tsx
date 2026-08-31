import * as stylex from "@stylexjs/stylex";
import { omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import { tokens } from "../../styles/tokens.stylex";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

// Status tones are a 14% tint of the tone colour over the card surface, with a
// stronger border of the same hue. StyleX evaluates these at build time, so the
// formula is written out per tone rather than shared through a helper.
const styles = stylex.create({
  root: {
    alignItems: "center",
    borderRadius: tokens.radiusSm,
    borderStyle: "solid",
    borderWidth: 1,
    display: "inline-flex",
    fontSize: "0.6875rem",
    fontWeight: 650,
    gap: "0.3rem",
    lineHeight: 1.45,
    paddingBlock: "0.15rem",
    paddingInline: "0.4rem",
    whiteSpace: "nowrap",
  },
  neutral: {
    backgroundColor: tokens.surfaceSunken,
    borderColor: tokens.border,
    color: tokens.textMuted,
  },
  accent: {
    backgroundColor: `color-mix(in srgb, ${tokens.accent} 14%, ${tokens.surface})`,
    borderColor: `color-mix(in srgb, ${tokens.accent} 32%, transparent)`,
    color: tokens.accent,
  },
  success: {
    backgroundColor: `color-mix(in srgb, ${tokens.success} 14%, ${tokens.surface})`,
    borderColor: `color-mix(in srgb, ${tokens.success} 32%, transparent)`,
    color: tokens.success,
  },
  warning: {
    backgroundColor: `color-mix(in srgb, ${tokens.warning} 14%, ${tokens.surface})`,
    borderColor: `color-mix(in srgb, ${tokens.warning} 32%, transparent)`,
    color: tokens.warning,
  },
  danger: {
    backgroundColor: `color-mix(in srgb, ${tokens.danger} 14%, ${tokens.surface})`,
    borderColor: `color-mix(in srgb, ${tokens.danger} 32%, transparent)`,
    color: tokens.danger,
  },
  mono: {
    fontFamily: tokens.fontMono,
    fontWeight: 500,
    letterSpacing: "-0.01em",
  },
});

export interface BadgeProps
  extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, "class" | "style">, StyleProps {
  tone?: "neutral" | "accent" | "success" | "warning" | "danger";
  mono?: boolean;
}

const tones = {
  neutral: styles.neutral,
  accent: styles.accent,
  success: styles.success,
  warning: styles.warning,
  danger: styles.danger,
};

export function Badge(props: BadgeProps) {
  const elementProps = omit(props, "tone", "mono", "xstyle");
  const styleAttributes = reactiveStyleAttributes(() =>
    stylex.attrs(
      styles.root,
      tones[props.tone ?? "neutral"],
      props.mono && styles.mono,
      props.xstyle,
    ),
  );

  return <span {...mergeProps(styleAttributes, elementProps)} />;
}
