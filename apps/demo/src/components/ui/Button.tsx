import * as stylex from "@stylexjs/stylex";
import { base } from "./base";
import { omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import { colors, controls, motion, radii, shadows, typography } from "./tokens.stylex";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

const styles = stylex.create({
  root: {
    alignItems: "center",
    appearance: "none",
    borderStyle: "solid",
    borderWidth: 1,
    cursor: "pointer",
    display: "inline-flex",
    fontWeight: typography.semibold,
    justifyContent: "center",
    letterSpacing: "-0.005em",
    lineHeight: 1,
    textDecoration: "none",
    whiteSpace: "nowrap",
    transitionDuration: motion.fast,
    transitionProperty: "background-color, border-color, color, box-shadow, transform",
    transitionTimingFunction: motion.easing,
    userSelect: "none",
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: 0,
      transitionProperty: "none",
    },
    ":active": {
      transform: "scale(0.975)",
    },
    ":disabled": {
      cursor: "not-allowed",
      opacity: controls.disabledOpacity,
    },
  },
  block: { width: "100%" },
});

/** The colour axis. One `create` per axis is the StyleX variants recipe. */
const variantStyles = stylex.create({
  primary: {
    backgroundColor: {
      default: colors.primary,
      ":hover": colors.primaryHover,
    },
    borderColor: colors.primary,
    color: colors.primaryForeground,
    boxShadow: shadows.sm,
  },
  secondary: {
    backgroundColor: {
      default: colors.surface,
      ":hover": colors.interactive,
    },
    borderColor: colors.border,
    color: { default: colors.surfaceForeground, ":hover": colors.interactiveForeground },
    boxShadow: shadows.sm,
  },
  ghost: {
    backgroundColor: {
      default: "transparent",
      ":hover": colors.interactive,
    },
    borderColor: "transparent",
    color: {
      default: colors.mutedForeground,
      ":hover": colors.interactiveForeground,
    },
  },
  outline: {
    backgroundColor: {
      default: "transparent",
      ":hover": colors.interactive,
    },
    borderColor: {
      default: colors.borderStrong,
      ":hover": colors.foreground,
    },
    color: { default: colors.foreground, ":hover": colors.interactiveForeground },
  },
  danger: {
    backgroundColor: {
      default: colors.danger,
      ":hover": colors.dangerHover,
    },
    borderColor: colors.danger,
    color: colors.dangerForeground,
    boxShadow: shadows.sm,
  },
});

/** The dimension axis. Every entry sets the same properties, so they compose. */
const sizeStyles = stylex.create({
  xs: {
    borderRadius: radii.sm,
    fontSize: typography.xs,
    gap: "0.25rem",
    minHeight: {
      default: controls.heightXs,
      "@media (pointer: coarse)": `max(${controls.heightXs}, ${controls.touchTarget})`,
    },
    paddingInline: "0.5rem",
  },
  sm: {
    borderRadius: radii.sm,
    fontSize: typography.sm,
    gap: "0.25rem",
    minHeight: {
      default: controls.heightSm,
      "@media (pointer: coarse)": `max(${controls.heightSm}, ${controls.touchTarget})`,
    },
    paddingInline: "0.625rem",
  },
  md: {
    borderRadius: radii.md,
    fontSize: typography.md,
    gap: "0.375rem",
    minHeight: {
      default: controls.height,
      "@media (pointer: coarse)": `max(${controls.height}, ${controls.touchTarget})`,
    },
    paddingInline: "0.625rem",
  },
  lg: {
    borderRadius: radii.md,
    fontSize: typography.md,
    gap: "0.375rem",
    minHeight: {
      default: controls.heightLg,
      "@media (pointer: coarse)": `max(${controls.heightLg}, ${controls.touchTarget})`,
    },
    paddingInline: "0.625rem",
  },
  "icon-xs": {
    borderRadius: radii.sm,
    height: {
      default: controls.heightXs,
      "@media (pointer: coarse)": `max(${controls.heightXs}, ${controls.touchTarget})`,
    },
    padding: 0,
    width: {
      default: controls.heightXs,
      "@media (pointer: coarse)": `max(${controls.heightXs}, ${controls.touchTarget})`,
    },
  },
  "icon-sm": {
    borderRadius: radii.sm,
    height: {
      default: controls.heightSm,
      "@media (pointer: coarse)": `max(${controls.heightSm}, ${controls.touchTarget})`,
    },
    padding: 0,
    width: {
      default: controls.heightSm,
      "@media (pointer: coarse)": `max(${controls.heightSm}, ${controls.touchTarget})`,
    },
  },
  icon: {
    borderRadius: radii.md,
    height: {
      default: controls.height,
      "@media (pointer: coarse)": `max(${controls.height}, ${controls.touchTarget})`,
    },
    padding: 0,
    width: {
      default: controls.height,
      "@media (pointer: coarse)": `max(${controls.height}, ${controls.touchTarget})`,
    },
  },
  "icon-lg": {
    borderRadius: radii.md,
    height: {
      default: controls.heightLg,
      "@media (pointer: coarse)": `max(${controls.heightLg}, ${controls.touchTarget})`,
    },
    padding: 0,
    width: {
      default: controls.heightLg,
      "@media (pointer: coarse)": `max(${controls.heightLg}, ${controls.touchTarget})`,
    },
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
export function buttonStyle(appearance: ButtonAppearance = {}): stylex.StyleXStyles {
  // `StyleXStyles` uses one generic for the whole array, so a mix of compiled
  // styles from different `stylex.create` calls does not satisfy it directly.
  // `stylex.attrs`, the only consumer, accepts each element, so this cast is safe.
  return [
    styles.root,
    base.focusRing,
    variantStyles[appearance.variant ?? "primary"],
    sizeStyles[appearance.size ?? "md"],
  ] as unknown as stylex.StyleXStyles;
}

export function Button(props: ButtonProps) {
  const elementProps = omit(props, "variant", "size", "block", "xstyle");
  const styleAttributes = reactiveStyleAttributes(() =>
    stylex.attrs(
      styles.root,
      base.focusRing,
      variantStyles[props.variant ?? "primary"],
      sizeStyles[props.size ?? "md"],
      props.block && styles.block,
      props.xstyle,
    ),
  );

  return <button type="button" {...mergeProps(styleAttributes, elementProps)} />;
}
