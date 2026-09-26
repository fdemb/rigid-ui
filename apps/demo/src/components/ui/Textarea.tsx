import * as stylex from "@stylexjs/stylex";
import { base } from "./base";
import { controls, typography } from "./tokens.stylex";
import { omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import { reactiveStyleAttributes, type StyleProps } from "./styleProps";
import { fieldStyles } from "./Input";

const styles = stylex.create({
  root: {
    display: "block",
    lineHeight: typography.bodyLineHeight,
    minHeight: `calc(${controls.height} * 2)`,
    paddingBlock: "0.55rem",
    paddingInline: "0.7rem",
    resize: "vertical",
  },
});

export interface TextareaProps
  extends Omit<JSX.TextareaHTMLAttributes<HTMLTextAreaElement>, "class" | "style">, StyleProps {
  mono?: boolean;
  invalid?: boolean;
}

export function Textarea(props: TextareaProps) {
  const elementProps = omit(props, "mono", "invalid", "xstyle");
  const styleAttributes = reactiveStyleAttributes(() =>
    stylex.attrs(
      fieldStyles.root,
      base.focusRing,
      styles.root,
      props.mono && fieldStyles.mono,
      props.invalid && fieldStyles.invalid,
      props.xstyle,
    ),
  );

  return (
    <textarea
      aria-invalid={props.invalid ? "true" : undefined}
      {...mergeProps(styleAttributes, elementProps)}
    />
  );
}
