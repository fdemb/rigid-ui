import * as stylex from "@stylexjs/stylex";
import { omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import { tokens } from "../../styles/tokens.stylex";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

const styles = stylex.create({
  root: {
    backgroundColor: tokens.surface,
    borderColor: tokens.border,
    borderRadius: tokens.radiusLg,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: tokens.shadowSm,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  interactive: {
    borderColor: {
      default: tokens.border,
      ":hover": tokens.borderStrong,
    },
    transitionDuration: tokens.durationFast,
    transitionProperty: "border-color, background-color",
    transitionTimingFunction: tokens.easing,
  },
  header: {
    alignItems: "baseline",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.6rem",
    justifyContent: "space-between",
    paddingBlock: "0.85rem",
    paddingInline: "1rem",
  },
  title: {
    fontSize: "0.875rem",
    fontWeight: 650,
    letterSpacing: "-0.012em",
    margin: 0,
  },
  description: {
    color: tokens.textMuted,
    flexBasis: "100%",
    fontSize: "0.8125rem",
    lineHeight: 1.55,
    margin: 0,
  },
  body: {
    display: "flex",
    flexDirection: "column",
    gap: "0.85rem",
    paddingBlock: "1rem",
    paddingInline: "1rem",
  },
  footer: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    justifyContent: "flex-end",
    paddingBlock: "0.75rem",
    paddingInline: "1rem",
  },
  divided: {
    borderColor: tokens.border,
    borderStyle: "solid",
    borderWidth: 0,
  },
  dividedTop: { borderTopWidth: 1 },
  dividedBottom: { borderBottomWidth: 1 },
});

export interface CardProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class" | "style">, StyleProps {
  /** React to hover, for cards that are themselves a link or a button. */
  interactive?: boolean;
}

export function Card(props: CardProps) {
  const elementProps = omit(props, "interactive", "xstyle");
  const styleAttributes = reactiveStyleAttributes(() =>
    stylex.attrs(styles.root, props.interactive && styles.interactive, props.xstyle),
  );
  return <div {...mergeProps(styleAttributes, elementProps)} />;
}

interface SectionProps
  extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "class" | "style">, StyleProps {
  /** Draw the hairline that separates this section from the card body. */
  divided?: boolean;
}

export function CardHeader(props: SectionProps) {
  const elementProps = omit(props, "divided", "xstyle");
  const styleAttributes = reactiveStyleAttributes(() =>
    stylex.attrs(
      styles.header,
      props.divided && styles.divided,
      props.divided && styles.dividedBottom,
      props.xstyle,
    ),
  );
  return <div {...mergeProps(styleAttributes, elementProps)} />;
}

export function CardTitle(
  props: Omit<JSX.HTMLAttributes<HTMLHeadingElement>, "class" | "style"> & StyleProps,
) {
  const elementProps = omit(props, "xstyle");
  const styleAttributes = reactiveStyleAttributes(() => stylex.attrs(styles.title, props.xstyle));
  return <h3 {...mergeProps(styleAttributes, elementProps)} />;
}

export function CardDescription(
  props: Omit<JSX.HTMLAttributes<HTMLParagraphElement>, "class" | "style"> & StyleProps,
) {
  const elementProps = omit(props, "xstyle");
  const styleAttributes = reactiveStyleAttributes(() =>
    stylex.attrs(styles.description, props.xstyle),
  );
  return <p {...mergeProps(styleAttributes, elementProps)} />;
}

export function CardBody(props: CardProps) {
  const elementProps = omit(props, "interactive", "xstyle");
  const styleAttributes = reactiveStyleAttributes(() => stylex.attrs(styles.body, props.xstyle));
  return <div {...mergeProps(styleAttributes, elementProps)} />;
}

export function CardFooter(props: SectionProps) {
  const elementProps = omit(props, "divided", "xstyle");
  const styleAttributes = reactiveStyleAttributes(() =>
    stylex.attrs(
      styles.footer,
      props.divided && styles.divided,
      props.divided && styles.dividedTop,
      props.xstyle,
    ),
  );
  return <div {...mergeProps(styleAttributes, elementProps)} />;
}
