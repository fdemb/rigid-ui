import * as stylex from "@stylexjs/stylex";
import { omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { mergeProps } from "rigid-ui/primitives/merge-props";
import { Separator as SeparatorPrimitive } from "rigid-ui/primitives/separator";

import { tokens } from "../../styles/tokens.stylex";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

const styles = stylex.create({
  root: {
    backgroundColor: tokens.border,
    border: "none",
    flexShrink: 0,
    margin: 0,
  },
});

/** The orientation axis. */
const orientationStyles = stylex.create({
  horizontal: { height: 1, width: "100%" },
  vertical: { alignSelf: "stretch", minHeight: "1rem", width: 1 },
});

export interface SeparatorProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class" | "style">, StyleProps {
  orientation?: keyof typeof orientationStyles;
  /**
   * Separators that only group visually should stay out of the accessibility
   * tree; leave this off when the rule carries meaning of its own.
   */
  decorative?: boolean;
}

export function Separator(props: SeparatorProps) {
  const elementProps = omit(props, "orientation", "decorative", "xstyle");
  const orientation = () => props.orientation ?? "horizontal";
  // StyleX resolves the arguments to `attrs` at build time, so the variant key
  // has to be a prop read. Indexing with `orientation()` fails to compile.
  const styleAttributes = reactiveStyleAttributes(() =>
    stylex.attrs(styles.root, orientationStyles[props.orientation ?? "horizontal"], props.xstyle),
  );

  return (
    <SeparatorPrimitive
      orientation={orientation()}
      aria-orientation={props.decorative ? undefined : orientation()}
      role={props.decorative ? "none" : "separator"}
      {...mergeProps(styleAttributes, elementProps)}
    />
  );
}
