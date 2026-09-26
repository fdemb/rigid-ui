import * as stylex from "@stylexjs/stylex";
import { omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import { colors, motion, radii, shadows, typography } from "./tokens.stylex";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

/*
 * Every section shares one padding. A header or footer without a divider drops
 * the padding it shares with its neighbour, so undivided sections sit one
 * padding apart instead of two.
 */
const styles = stylex.create({
  root: {
    backgroundColor: colors.surface,
    color: colors.surfaceForeground,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: shadows.sm,
    display: "flex",
    flexDirection: "column",
    minWidth: 0,
  },
  interactive: {
    borderColor: {
      default: colors.border,
      ":hover": colors.borderStrong,
    },
    transitionDuration: motion.fast,
    transitionProperty: "border-color, background-color",
    transitionTimingFunction: motion.easing,
    "@media (prefers-reduced-motion: reduce)": { transitionProperty: "none" },
  },
  section: {
    padding: "1rem",
  },
  header: {
    columnGap: "0.75rem",
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    paddingBlockEnd: { default: "1rem", ":not(:last-child)": 0 },
  },
  title: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    letterSpacing: "-0.012em",
    lineHeight: typography.headingLineHeight,
    margin: 0,
  },
  description: {
    color: colors.mutedForeground,
    fontSize: typography.sm,
    lineHeight: typography.bodyLineHeight,
    margin: 0,
    marginTop: "0.25rem",
  },
  action: {
    alignItems: "center",
    alignSelf: "center",
    display: "flex",
    gap: "0.5rem",
    gridColumn: 2,
    gridRow: "1 / span 2",
    justifySelf: "end",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  footer: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
    justifyContent: "flex-end",
    paddingBlockStart: { default: "1rem", ":not(:first-child)": 0 },
  },
  divided: {
    borderColor: colors.border,
    borderStyle: "solid",
    borderWidth: 0,
  },
  dividedHeader: { borderBottomWidth: 1, paddingBlockEnd: "1rem" },
  dividedFooter: { borderTopWidth: 1, paddingBlockStart: "1rem" },
});

type DivProps = Omit<JSX.HTMLAttributes<HTMLDivElement>, "class" | "style"> & StyleProps;

export interface CardProps extends DivProps {
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

export interface CardSectionProps extends DivProps {
  /** Draw a hairline between this section and the content. */
  divided?: boolean;
}

export function CardHeader(props: CardSectionProps) {
  const elementProps = omit(props, "divided", "xstyle");
  const styleAttributes = reactiveStyleAttributes(() =>
    stylex.attrs(
      styles.section,
      styles.header,
      props.divided && styles.divided,
      props.divided && styles.dividedHeader,
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

/** Sits at the end of the header, beside the title and description. */
export function CardAction(props: DivProps) {
  const elementProps = omit(props, "xstyle");
  const styleAttributes = reactiveStyleAttributes(() => stylex.attrs(styles.action, props.xstyle));
  return <div {...mergeProps(styleAttributes, elementProps)} />;
}

export function CardContent(props: DivProps) {
  const elementProps = omit(props, "xstyle");
  const styleAttributes = reactiveStyleAttributes(() =>
    stylex.attrs(styles.section, styles.content, props.xstyle),
  );
  return <div {...mergeProps(styleAttributes, elementProps)} />;
}

export function CardFooter(props: CardSectionProps) {
  const elementProps = omit(props, "divided", "xstyle");
  const styleAttributes = reactiveStyleAttributes(() =>
    stylex.attrs(
      styles.section,
      styles.footer,
      props.divided && styles.divided,
      props.divided && styles.dividedFooter,
      props.xstyle,
    ),
  );
  return <div {...mergeProps(styleAttributes, elementProps)} />;
}
