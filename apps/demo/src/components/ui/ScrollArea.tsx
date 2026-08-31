import * as stylex from "@stylexjs/stylex";
import { omit } from "solid-js";
import { mergeProps } from "rigid-ui/primitives/merge-props";
import { ScrollArea as ScrollAreaPrimitive } from "rigid-ui/primitives/scroll-area";

import { tokens } from "../../styles/tokens.stylex";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

const styles = stylex.create({
  root: {
    position: "relative",
  },
  viewport: {
    borderColor: tokens.border,
    borderRadius: tokens.radiusMd,
    borderStyle: "solid",
    borderWidth: 1,
    height: "100%",
    outline: "none",
    ":focus-visible": {
      borderColor: tokens.focus,
      boxShadow: `0 0 0 2px ${tokens.focus}`,
    },
  },
  content: {
    color: tokens.text,
  },
  scrollbar: {
    borderRadius: "999px",
    display: "flex",
    margin: "0.5rem",
    opacity: {
      default: 0,
      ":is([data-hovering])": 1,
      ":is([data-scrolling])": 1,
    },
    pointerEvents: {
      default: "none",
      ":is([data-hovering])": "auto",
      ":is([data-scrolling])": "auto",
    },
    transitionDuration: tokens.durationNormal,
    transitionProperty: "opacity",
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: 0,
      transitionProperty: "none",
    },
  },
  vertical: {
    backgroundColor: tokens.canvasMuted,
    width: "0.3rem",
  },
  horizontal: {
    backgroundColor: tokens.canvasMuted,
    height: "0.3rem",
  },
  thumb: {
    backgroundColor: tokens.borderStrong,
    borderRadius: "inherit",
    height: "100%",
    width: "100%",
  },
});

type RootProps = Parameters<typeof ScrollAreaPrimitive.Root>[0];
type ViewportProps = Parameters<typeof ScrollAreaPrimitive.Viewport>[0];
type ContentProps = Parameters<typeof ScrollAreaPrimitive.Content>[0];
type ScrollbarProps = Parameters<typeof ScrollAreaPrimitive.Scrollbar>[0];
type ThumbProps = Parameters<typeof ScrollAreaPrimitive.Thumb>[0];

function Root(props: RootProps & StyleProps) {
  const primitiveProps = omit(props, "xstyle");
  const attrs = reactiveStyleAttributes(() => stylex.attrs(styles.root, props.xstyle));
  return <ScrollAreaPrimitive.Root {...mergeProps(attrs, primitiveProps)} />;
}

function Viewport(props: ViewportProps & StyleProps) {
  const primitiveProps = omit(props, "xstyle");
  const attrs = reactiveStyleAttributes(() => stylex.attrs(styles.viewport, props.xstyle));
  return <ScrollAreaPrimitive.Viewport {...mergeProps(attrs, primitiveProps)} />;
}

function Content(props: ContentProps & StyleProps) {
  const primitiveProps = omit(props, "xstyle");
  const attrs = reactiveStyleAttributes(() => stylex.attrs(styles.content, props.xstyle));
  return <ScrollAreaPrimitive.Content {...mergeProps(attrs, primitiveProps)} />;
}

function Scrollbar(props: ScrollbarProps & StyleProps) {
  const primitiveProps = omit(props, "xstyle");
  const attrs = reactiveStyleAttributes(() =>
    stylex.attrs(
      styles.scrollbar,
      props.orientation === "horizontal" ? styles.horizontal : styles.vertical,
      props.xstyle,
    ),
  );
  return <ScrollAreaPrimitive.Scrollbar {...mergeProps(attrs, primitiveProps)} />;
}

function Thumb(props: ThumbProps & StyleProps) {
  const primitiveProps = omit(props, "xstyle");
  const attrs = reactiveStyleAttributes(() => stylex.attrs(styles.thumb, props.xstyle));
  return <ScrollAreaPrimitive.Thumb {...mergeProps(attrs, primitiveProps)} />;
}

export const ScrollArea = {
  Root,
  Viewport,
  Content,
  Scrollbar,
  Thumb,
  Corner: ScrollAreaPrimitive.Corner,
};
