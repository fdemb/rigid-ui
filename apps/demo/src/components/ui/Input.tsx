import * as stylex from "@stylexjs/stylex";
import { omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import { tokens } from "../../styles/tokens.stylex";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

/** Shared by `Input` and `Textarea` so the two stay dimensionally identical. */
export const fieldStyles = stylex.create({
  root: {
    backgroundColor: tokens.surface,
    borderColor: {
      default: tokens.border,
      ":hover": tokens.borderStrong,
    },
    borderRadius: tokens.radiusMd,
    borderStyle: "solid",
    borderWidth: 1,
    color: tokens.text,
    fontSize: "0.875rem",
    transitionDuration: tokens.durationFast,
    transitionProperty: "border-color, box-shadow, background-color",
    transitionTimingFunction: tokens.easing,
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: 0,
      transitionProperty: "none",
    },
    width: "100%",
    "::placeholder": { color: tokens.textSubtle },
    ":focus-visible": {
      borderColor: tokens.focus,
      outlineColor: tokens.focus,
      outlineOffset: 1,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
    ":disabled": {
      backgroundColor: tokens.surfaceSunken,
      cursor: "not-allowed",
      opacity: 0.6,
    },
  },
  invalid: {
    borderColor: {
      default: tokens.danger,
      ":hover": tokens.dangerHover,
    },
  },
  mono: { fontFamily: tokens.fontMono, fontSize: "0.8125rem" },
});

const styles = stylex.create({
  sm: { minHeight: "2.5rem", paddingBlock: "0.3rem", paddingInline: "0.55rem" },
  md: { minHeight: "2.75rem", paddingBlock: "0.5rem", paddingInline: "0.7rem" },
});

export interface InputProps
  extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "class" | "size" | "style">, StyleProps {
  size?: "sm" | "md";
  /** Render the value in the monospace stack, for tokens, keys, and paths. */
  mono?: boolean;
  invalid?: boolean;
}

const sizes = { sm: styles.sm, md: styles.md };

export function Input(props: InputProps) {
  const elementProps = omit(props, "size", "mono", "invalid", "xstyle");
  const styleAttributes = reactiveStyleAttributes(() =>
    stylex.attrs(
      fieldStyles.root,
      sizes[props.size ?? "md"],
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
