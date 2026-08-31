import * as stylex from "@stylexjs/stylex";
import { omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import { tokens } from "../../styles/tokens.stylex";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

const styles = stylex.create({
  root: {
    backgroundColor: tokens.border,
    border: "none",
    flexShrink: 0,
    margin: 0,
  },
  horizontal: { height: 1, width: "100%" },
  vertical: { alignSelf: "stretch", minHeight: "1rem", width: 1 },
});

export interface SeparatorProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class" | "style">, StyleProps {
  orientation?: "horizontal" | "vertical";
  /**
   * Separators that only group visually should stay out of the accessibility
   * tree; leave this off when the rule carries meaning of its own.
   */
  decorative?: boolean;
}

export function Separator(props: SeparatorProps) {
  const elementProps = omit(props, "orientation", "decorative", "xstyle");
  const orientation = () => props.orientation ?? "horizontal";
  const styleAttributes = reactiveStyleAttributes(() =>
    stylex.attrs(
      styles.root,
      orientation() === "vertical" ? styles.vertical : styles.horizontal,
      props.xstyle,
    ),
  );

  return (
    <div
      aria-orientation={props.decorative ? undefined : orientation()}
      role={props.decorative ? "none" : "separator"}
      {...mergeProps(styleAttributes, elementProps)}
    />
  );
}
