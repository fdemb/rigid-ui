import * as stylex from "@stylexjs/stylex";
import { omit } from "solid-js";
import { mergeProps } from "rigid-ui/primitives/merge-props";
import { Meter as MeterPrimitive } from "rigid-ui/primitives/meter";

import { colors, motion, radii, typography } from "./tokens.stylex";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

const styles = stylex.create({
  root: {
    color: colors.foreground,
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr) auto",
    gap: "0.5rem 0.75rem",
    minWidth: 0,
    width: "100%",
  },
  label: {
    fontSize: typography.sm,
    fontWeight: typography.semibold,
    gridColumn: "1",
    lineHeight: typography.bodyLineHeight,
    overflowWrap: "anywhere",
  },
  value: {
    color: colors.mutedForeground,
    fontSize: typography.sm,
    fontVariantNumeric: "tabular-nums",
    gridColumn: "2",
    lineHeight: typography.bodyLineHeight,
    textAlign: "end",
  },
  track: {
    backgroundColor: colors.interactive,
    borderRadius: radii.full,
    gridColumn: "1 / -1",
    height: "0.5rem",
    overflow: "hidden",
  },
  indicator: {
    backgroundColor: colors.primary,
    borderRadius: "inherit",
    transitionDuration: motion.normal,
    transitionProperty: "width",
    transitionTimingFunction: motion.easing,
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: 0,
      transitionProperty: "none",
    },
  },
});

type RootProps = Omit<MeterPrimitive.Root.Props, "class" | "style"> & StyleProps;
type LabelProps = Omit<MeterPrimitive.Label.Props, "class" | "style"> & StyleProps;
type ValueProps = Omit<MeterPrimitive.Value.Props, "class" | "style"> & StyleProps;
type TrackProps = Omit<MeterPrimitive.Track.Props, "class" | "style"> & StyleProps;
type IndicatorProps = Omit<MeterPrimitive.Indicator.Props, "class" | "style"> & StyleProps;

function Root(props: RootProps) {
  const primitiveProps = omit(props, "value", "xstyle");
  const attrs = reactiveStyleAttributes(() => stylex.attrs(styles.root, props.xstyle));
  return <MeterPrimitive.Root value={props.value} {...mergeProps(attrs, primitiveProps)} />;
}

function Label(props: LabelProps) {
  const primitiveProps = omit(props, "xstyle");
  const attrs = reactiveStyleAttributes(() => stylex.attrs(styles.label, props.xstyle));
  return <MeterPrimitive.Label {...mergeProps(attrs, primitiveProps)} />;
}

function Value(props: ValueProps) {
  const primitiveProps = omit(props, "xstyle");
  const attrs = reactiveStyleAttributes(() => stylex.attrs(styles.value, props.xstyle));
  return <MeterPrimitive.Value {...mergeProps(attrs, primitiveProps)} />;
}

function Track(props: TrackProps) {
  const primitiveProps = omit(props, "xstyle");
  const attrs = reactiveStyleAttributes(() => stylex.attrs(styles.track, props.xstyle));
  return <MeterPrimitive.Track {...mergeProps(attrs, primitiveProps)} />;
}

function Indicator(props: IndicatorProps) {
  const primitiveProps = omit(props, "xstyle");
  const attrs = reactiveStyleAttributes(() => stylex.attrs(styles.indicator, props.xstyle));
  return <MeterPrimitive.Indicator {...mergeProps(attrs, primitiveProps)} />;
}

export const Meter = { Root, Label, Value, Track, Indicator };
