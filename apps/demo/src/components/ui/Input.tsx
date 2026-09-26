import * as stylex from "@stylexjs/stylex";
import { base } from "./base";
import { omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import { colors, controls, motion, radii, typography } from "./tokens.stylex";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

/** Shared by `Input` and `Textarea` so the two stay dimensionally identical. */
export const fieldStyles = stylex.create({
  root: {
    backgroundColor: colors.surface,
    borderColor: {
      default: colors.border,
      ":hover": colors.borderStrong,
    },
    borderRadius: radii.md,
    borderStyle: "solid",
    borderWidth: 1,
    color: colors.surfaceForeground,
    fontSize: typography.md,
    transitionDuration: motion.fast,
    transitionProperty: "border-color, box-shadow, background-color",
    transitionTimingFunction: motion.easing,
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: 0,
      transitionProperty: "none",
    },
    width: "100%",
    "::placeholder": { color: colors.subtleForeground },
    ":focus-visible": {
      borderColor: colors.focus,
    },
    ":disabled": {
      backgroundColor: colors.muted,
      cursor: "not-allowed",
      opacity: controls.disabledOpacity,
    },
  },
  invalid: {
    borderColor: {
      default: colors.danger,
      ":hover": colors.dangerHover,
    },
  },
  mono: { fontFamily: typography.mono, fontSize: typography.sm },
});

/** The size axis. Textarea sets its own metrics, so this stays local to Input. */
const sizeStyles = stylex.create({
  sm: {
    minHeight: {
      default: controls.heightSm,
      "@media (pointer: coarse)": `max(${controls.heightSm}, ${controls.touchTarget})`,
    },
    paddingBlock: "0.3rem",
    paddingInline: "0.55rem",
  },
  md: {
    minHeight: {
      default: controls.height,
      "@media (pointer: coarse)": `max(${controls.height}, ${controls.touchTarget})`,
    },
    paddingBlock: "0.5rem",
    paddingInline: "0.7rem",
  },
});

export interface InputProps
  extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "class" | "size" | "style">, StyleProps {
  size?: keyof typeof sizeStyles;
  /** Render the value in the monospace stack, for tokens, keys, and paths. */
  mono?: boolean;
  invalid?: boolean;
}

export function Input(props: InputProps) {
  const elementProps = omit(props, "size", "mono", "invalid", "xstyle");
  const styleAttributes = reactiveStyleAttributes(() =>
    stylex.attrs(
      fieldStyles.root,
      base.focusRing,
      sizeStyles[props.size ?? "md"],
      props.mono && fieldStyles.mono,
      props.invalid && fieldStyles.invalid,
      props.xstyle,
    ),
  );

  return (
    <input
      aria-invalid={props.invalid ? "true" : undefined}
      {...mergeProps(styleAttributes, elementProps)}
    />
  );
}
