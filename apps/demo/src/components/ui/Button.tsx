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
  xs: {
    borderRadius: tokens.radiusSm,
    fontSize: "0.75rem",
    minHeight: "1.65rem",
    paddingInline: "0.5rem",
  },
  sm: {
    borderRadius: tokens.radiusSm,
    fontSize: "0.8125rem",
    minHeight: "2rem",
    paddingInline: "0.7rem",
  },
  md: {
    borderRadius: tokens.radiusMd,
    fontSize: "0.875rem",
    minHeight: "2.5rem",
    paddingInline: "1rem",
  },
  lg: {
    borderRadius: tokens.radiusMd,
    fontSize: "0.95rem",
    minHeight: "2.875rem",
    paddingInline: "1.2rem",
  },
  icon: {
    borderRadius: tokens.radiusMd,
    height: "2.25rem",
    padding: 0,
    width: "2.25rem",
  },
  block: { width: "100%" },
});

export interface ButtonProps
  extends Omit<JSX.ButtonHTMLAttributes<HTMLButtonElement>, "class" | "style">, StyleProps {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "xs" | "sm" | "md" | "lg" | "icon";
  /** Stretch to the width of the containing block. */
  block?: boolean;
}

/** The appearance knobs a primitive-backed trigger forwards to its Button. */
export type ButtonAppearance = Pick<ButtonProps, "variant" | "size">;

const variants = {
  primary: styles.primary,
  secondary: styles.secondary,
  outline: styles.outline,
  ghost: styles.ghost,
  danger: styles.danger,
};

const sizes = {
  xs: styles.xs,
  sm: styles.sm,
  md: styles.md,
  lg: styles.lg,
  icon: styles.icon,
};

/**
 * The button recipe as bare styles, for elements that must not be a `<button>`.
 * An anchor, most often. Links then match without nesting a control inside one.
 */
export function buttonStyle(appearance: ButtonAppearance = {}) {
  return [
    styles.root,
    variants[appearance.variant ?? "secondary"],
    sizes[appearance.size ?? "md"],
  ] as const;
}

export function Button(props: ButtonProps) {
  const elementProps = omit(props, "variant", "size", "block", "xstyle");
  const styleAttributes = reactiveStyleAttributes(() =>
    stylex.attrs(
      styles.root,
      variants[props.variant ?? "secondary"],
      sizes[props.size ?? "md"],
      props.block && styles.block,
      props.xstyle,
    ),
  );

  return <button type="button" {...mergeProps(styleAttributes, elementProps)} />;
}
