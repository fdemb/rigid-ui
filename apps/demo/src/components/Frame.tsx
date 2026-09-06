import * as stylex from "@stylexjs/stylex";
import { Show, omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import { tokens } from "../styles/tokens.stylex";
import { reactiveStyleAttributes, type StyleProps } from "./ui/styleProps";

/**
 * The structural grid the whole site is drawn on. Two vertical rails mark the
 * edges of the content column and run from the header to the footer; the space
 * outside them is bare canvas. Every region between the rails is a horizontal
 * band, sitting flush against its neighbours and parted from them by one
 * hairline.
 *
 * Nothing inside the frame carries an outer margin, and that is load-bearing
 * rather than stylistic: a `gap` or a `margin` anywhere in the stack shows up
 * as a break in a rail. Space goes inside a cell, never between two of them.
 *
 * A band comes in two widths. `Bleed` carries its rule edge to edge across the
 * viewport and centres the rails inside it; that is the shape used wherever the
 * page owns the full width — the home page, the footer, the mobile catalog bar.
 * `Band` draws its rule at column width and is what a documentation page uses,
 * because those pages sit in a column the sidebar has already narrowed, and a
 * viewport-wide rule there would cut straight across the sidebar rail.
 */
export const frame = stylex.create({
  /** The content column. Its own two borders are the rails. */
  column: {
    borderInlineColor: tokens.border,
    borderInlineStyle: "solid",
    borderInlineWidth: 1,
    marginInline: "auto",
    maxWidth: tokens.contentWidth,
    width: "100%",
  },
  /** Inline padding that clears the rails. Every cell that holds text uses it. */
  inset: { paddingInline: tokens.inset },
  /** Holds the rails open to the bottom of the viewport on a short page. */
  runout: { flexGrow: 1 },
});

const styles = stylex.create({
  bleed: {
    borderBottomColor: tokens.border,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    width: "100%",
  },
  /*
   * The footer is the one band that rules its top edge, so it is the one place
   * two rules can land on the same seam. It overlaps the pixel above it instead
   * of the band above dropping its rule: a band keeps its rule whether or not
   * anything follows it, and when the two do meet they paint the same row.
   */
  bleedTop: {
    borderBottomWidth: 0,
    borderTopColor: tokens.border,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    marginBlockStart: -1,
  },
  header: {
    alignItems: "baseline",
    backgroundColor: tokens.canvasMuted,
    borderBottomColor: tokens.border,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "flex",
    flexWrap: "wrap",
    gap: "0.25rem 0.75rem",
    justifyContent: "space-between",
    paddingBlock: "0.7rem",
  },
  headerTitle: {
    color: tokens.text,
    fontSize: "0.75rem",
    fontWeight: 680,
    letterSpacing: "0.06em",
    margin: 0,
    textTransform: "uppercase",
  },
  headerNote: { color: tokens.textSubtle, fontFamily: tokens.fontMono, fontSize: "0.6875rem" },
  band: {
    borderBottomColor: tokens.border,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
  },
});

/**
 * The label strip that opens a band: a small uppercase label, and an optional
 * monospace note on the right for a path, an axis list, or a count. A page then
 * reads as a run of named regions rather than a stack of titled cards.
 */
export function BandHeader(props: { title: string; note?: string }) {
  return (
    <div {...stylex.attrs(frame.inset, styles.header)}>
      <h2 {...stylex.attrs(styles.headerTitle)}>{props.title}</h2>
      <Show when={props.note}>
        {(note) => <p {...stylex.attrs(styles.headerNote)}>{note()}</p>}
      </Show>
    </div>
  );
}

interface BleedProps extends Omit<JSX.HTMLAttributes<HTMLElement>, "class" | "style">, StyleProps {
  /** Drop the inline inset, for a band that lays its own cells out instead. */
  bare?: boolean;
  /** Which edge carries the rule. The footer closes the page from above. */
  rule?: "bottom" | "top";
}

/**
 * A band whose rule runs the width of the viewport. The rails are drawn by the
 * centred column inside it, so the rule crosses the gutters while the rails
 * stay where every other band puts them.
 */
export function Bleed(props: BleedProps) {
  // The rule belongs to the outer element and the rails to the inner one, so
  // the caller's own props stay on the outer section and only children move in.
  const rest = omit(props, "bare", "children", "rule", "xstyle");
  const outer = reactiveStyleAttributes(() =>
    stylex.attrs(styles.bleed, props.rule === "top" && styles.bleedTop),
  );
  const inner = reactiveStyleAttributes(() =>
    stylex.attrs(frame.column, !props.bare && frame.inset, props.xstyle),
  );

  return (
    <section {...mergeProps(outer, rest)}>
      <div {...inner}>{props.children}</div>
    </section>
  );
}

interface BandProps extends Omit<JSX.HTMLAttributes<HTMLElement>, "class" | "style">, StyleProps {
  /** Drop the inline inset, for a band that lays its own cells out instead. */
  bare?: boolean;
}

/** One horizontal region of the frame: full column width, one rule beneath. */
export default function Band(props: BandProps) {
  const rest = omit(props, "bare", "xstyle");
  const attrs = reactiveStyleAttributes(() =>
    stylex.attrs(styles.band, !props.bare && frame.inset, props.xstyle),
  );

  return <section {...mergeProps(attrs, rest)} />;
}
