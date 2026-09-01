import * as stylex from "@stylexjs/stylex";
import { omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import { tokens } from "../../styles/tokens.stylex";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

const styles = stylex.create({
  root: {
    alignItems: "center",
    appearance: "none",
    borderStyle: "solid",
    borderWidth: 1,
    cursor: "pointer",
    display: "inline-flex",
    fontWeight: 600,
    gap: "0.45rem",
    justifyContent: "center",
    letterSpacing: "-0.005em",
    lineHeight: 1,
    textDecoration: "none",
    whiteSpace: "nowrap",
    transitionDuration: tokens.durationFast,
    transitionProperty: "background-color, border-color, color, box-shadow, transform",
    transitionTimingFunction: tokens.easing,
    userSelect: "none",
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: 0,
      transitionProperty: "none",
    },
    ":active": {
      transform: "scale(0.975)",
    },
    ":focus-visible": {
      outlineColor: tokens.focus,
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
    ":disabled": {
      cursor: "not-allowed",
      opacity: 0.52,
    },
  },
  block: { width: "100%" },
});

/** The colour axis. One `create` per axis is the StyleX variants recipe. */
const variantStyles = stylex.create({
  primary: {
    backgroundColor: {
      default: tokens.accent,
      ":hover": tokens.accentHover,
    },
    borderColor: tokens.accent,
    color: tokens.accentText,
    boxShadow: tokens.shadowSm,
  },
  secondary: {
    backgroundColor: {
      default: tokens.surface,
      ":hover": tokens.surfaceInteractive,
    },
    borderColor: tokens.border,
    color: tokens.text,
    boxShadow: tokens.shadowSm,
  },
  ghost: {
    backgroundColor: {
      default: "transparent",
      ":hover": tokens.surfaceInteractive,
    },
    borderColor: "transparent",
    color: {
      default: tokens.textMuted,
      ":hover": tokens.text,
    },
  },
  outline: {
    backgroundColor: {
      default: "transparent",
      ":hover": tokens.surfaceInteractive,
    },
    borderColor: {
      default: tokens.borderStrong,
      ":hover": tokens.text,
    },
    color: tokens.text,
  },
  danger: {
    backgroundColor: {
      default: tokens.danger,
      ":hover": tokens.dangerHover,
    },
    borderColor: tokens.danger,
    color: tokens.dangerText,
    boxShadow: tokens.shadowSm,
  },
});

/** The dimension axis. Every entry sets the same properties, so they compose. */
const sizeStyles = stylex.create({
  xs: {
    borderRadius: tokens.radiusSm,
    fontSize: "0.75rem",
    minHeight: "2.25rem",
    paddingInline: "0.5rem",
    "@media (pointer: coarse)": { minHeight: "2.75rem" },
  },
  sm: {
    borderRadius: tokens.radiusSm,
    fontSize: "0.8125rem",
    minHeight: "2.5rem",
    paddingInline: "0.7rem",
    "@media (pointer: coarse)": { minHeight: "2.75rem" },
  },
  md: {
    borderRadius: tokens.radiusMd,
    fontSize: "0.875rem",
    minHeight: "2.75rem",
    paddingInline: "1rem",
  },
  lg: {
    borderRadius: tokens.radiusMd,
    fontSize: "0.95rem",
    minHeight: "3rem",
    paddingInline: "1.2rem",
  },
  icon: {
    borderRadius: tokens.radiusMd,
    height: "2.75rem",
    padding: 0,
    width: "2.75rem",
  },
});

export interface ButtonProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "class" | "style">, StyleProps {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  /** Stretch to the width of the containing block. */
  block?: boolean;
}

/** The appearance knobs a primitive-backed trigger forwards to its Button. */
export type ButtonAppearance = Pick<ButtonProps, "variant" | "size">;

/**
 * The button recipe as bare styles, for elements that must not be a `<button>`.
 * An anchor, most often. Links then match without nesting a control inside one.
 */
export function buttonStyle(appearance: ButtonAppearance = {}) {
  return [
    styles.root,
    variantStyles[appearance.variant ?? "secondary"],
    sizeStyles[appearance.size ?? "md"],
  ] as const;
}

export function Button(props: ButtonProps) {
  const elementProps = omit(props, "variant", "size", "block", "xstyle");
  const styleAttributes = reactiveStyleAttributes(() =>
    stylex.attrs(
      styles.root,
      variantStyles[props.variant ?? "secondary"],
      sizeStyles[props.size ?? "md"],
      props.block && styles.block,
      props.xstyle,
    ),
  );

  return <button type="button" {...mergeProps(styleAttributes, elementProps)} />;
}
