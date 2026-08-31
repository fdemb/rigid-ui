import * as stylex from "@stylexjs/stylex";
import { omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import { tokens } from "../../styles/tokens.stylex";
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
    backgroundColor: tokens.surfaceSunken,
    backgroundImage: `linear-gradient(90deg, transparent, color-mix(in srgb, ${tokens.borderStrong} 45%, transparent), transparent)`,
    backgroundRepeat: "no-repeat",
    backgroundSize: "200% 100%",
    borderRadius: tokens.radiusSm,
    display: "block",
    flexShrink: 0,
  },
  text: { height: "0.7em", marginBlock: "0.25em" },
  circle: { borderRadius: tokens.radiusFull },
});

export interface SkeletonProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class" | "style">, StyleProps {
  shape?: "block" | "text" | "circle";
  width?: string;
  height?: string;
}

export function Skeleton(props: SkeletonProps) {
  const elementProps = omit(props, "shape", "width", "height", "xstyle");
  // StyleX evaluates the arguments to `attrs` at build time, so the conditions
  // have to read props directly; a local accessor is not analyzable.
  const styleAttributes = reactiveStyleAttributes(() =>
    stylex.attrs(
      styles.root,
      props.shape === "text" && styles.text,
      props.shape === "circle" && styles.circle,
      props.xstyle,
    ),
  );

  const size = {
    get style() {
      return { width: props.width, height: props.height };
    },
  };

  return <div aria-hidden="true" {...mergeProps(styleAttributes, size, elementProps)} />;
}
