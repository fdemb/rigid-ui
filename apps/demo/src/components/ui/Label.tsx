import * as stylex from "@stylexjs/stylex";
import { Show, omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import { colors, typography } from "./tokens.stylex";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

const styles = stylex.create({
  root: {
    alignItems: "center",
    color: colors.foreground,
    display: "inline-flex",
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    gap: "0.3rem",
    lineHeight: typography.bodyLineHeight,
  },
  required: { color: colors.danger },
});

export interface LabelProps
  extends Omit<JSX.LabelHTMLAttributes<HTMLLabelElement>, "class" | "style">, StyleProps {
  /** Append the conventional asterisk marker. */
  required?: boolean;
}

export function Label(props: LabelProps) {
  const elementProps = omit(props, "required", "xstyle", "children");
  const styleAttributes = reactiveStyleAttributes(() => stylex.attrs(styles.root, props.xstyle));

  return (
    <label {...mergeProps(styleAttributes, elementProps)}>
      {props.children}
      <Show when={props.required}>
        <span aria-hidden="true" {...stylex.attrs(styles.required)}>
          *
        </span>
      </Show>
    </label>
  );
}
