import * as stylex from "@stylexjs/stylex";
import { omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import { colors, radii, typography } from "./tokens.stylex";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

const styles = stylex.create({
  root: {
    alignItems: "center",
    borderRadius: radii.sm,
    borderStyle: "solid",
    borderWidth: 1,
    display: "inline-flex",
    fontSize: typography.caption,
    fontWeight: typography.bold,
    gap: "0.3rem",
    lineHeight: typography.bodyLineHeight,
    paddingBlock: "0.15rem",
    paddingInline: "0.4rem",
    whiteSpace: "nowrap",
  },
  mono: {
    fontFamily: typography.mono,
    fontWeight: typography.medium,
    letterSpacing: "-0.01em",
  },
});

const toneStyles = stylex.create({
  neutral: {
    backgroundColor: colors.muted,
    borderColor: colors.border,
    color: colors.mutedForeground,
  },
  accent: {
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primaryBorder,
    color: colors.primaryMutedForeground,
  },
  success: {
    backgroundColor: colors.success,
    borderColor: colors.successBorder,
    color: colors.successForeground,
  },
  warning: {
    backgroundColor: colors.warning,
    borderColor: colors.warningBorder,
    color: colors.warningForeground,
  },
  danger: {
    backgroundColor: colors.dangerMuted,
    borderColor: colors.dangerBorder,
    color: colors.dangerMutedForeground,
  },
});

export interface BadgeProps
  extends Omit<JSX.HTMLAttributes<HTMLSpanElement>, "class" | "style">, StyleProps {
  tone?: keyof typeof toneStyles;
  mono?: boolean;
}

export function Badge(props: BadgeProps) {
  const elementProps = omit(props, "tone", "mono", "xstyle");
  const styleAttributes = reactiveStyleAttributes(() =>
    stylex.attrs(
      styles.root,
      toneStyles[props.tone ?? "neutral"],
      props.mono && styles.mono,
      props.xstyle,
    ),
  );

  return <span {...mergeProps(styleAttributes, elementProps)} />;
}
