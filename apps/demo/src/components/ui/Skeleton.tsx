import * as stylex from "@stylexjs/stylex";
import { omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import { colors, radii } from "./tokens.stylex";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

const shimmer = stylex.keyframes({
  from: { backgroundPosition: "100% 0" },
  to: { backgroundPosition: "-100% 0" },
});

const styles = stylex.create({
  root: {
    animationDuration: "1.4s",
    animationIterationCount: "infinite",
    animationName: {
      default: shimmer,
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    animationTimingFunction: "linear",
    backgroundColor: colors.muted,
    backgroundImage: `linear-gradient(90deg, transparent, color-mix(in srgb, ${colors.borderStrong} 45%, transparent), transparent)`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "200% 100%",
    borderRadius: radii.sm,
    display: "block",
    flexShrink: 0,
  },
});

/** The shape axis. `block` is the base rectangle, so it adds nothing. */
const shapeStyles = stylex.create({
  block: {},
  text: { height: "0.7em", marginBlock: "0.25em" },
  circle: { borderRadius: radii.full },
});

export interface SkeletonProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class" | "style">, StyleProps {
  shape?: keyof typeof shapeStyles;
  width?: string;
  height?: string;
}

export function Skeleton(props: SkeletonProps) {
  const elementProps = omit(props, "shape", "width", "height", "xstyle");
  const styleAttributes = reactiveStyleAttributes(() =>
    stylex.attrs(styles.root, shapeStyles[props.shape ?? "block"], props.xstyle),
  );

  const size = {
    get style() {
      return { width: props.width, height: props.height };
    },
  };

  return <div aria-hidden="true" {...mergeProps(styleAttributes, size, elementProps)} />;
}
