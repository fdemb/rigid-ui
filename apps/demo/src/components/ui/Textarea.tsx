import * as stylex from "@stylexjs/stylex";
import { omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import { reactiveStyleAttributes, type StyleProps } from "./styleProps";
import { fieldStyles } from "./Input";

const styles = stylex.create({
  root: {
    display: "block",
    lineHeight: 1.6,
    minHeight: "5.5rem",
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
