import * as stylex from "@stylexjs/stylex";
import { createContext, omit, useContext } from "solid-js";
import { mergeProps } from "rigid-ui/primitives/merge-props";
import { Tabs as TabsPrimitive } from "rigid-ui/primitives/tabs";

import { colors, motion, radii, shadows, typography } from "./tokens.stylex";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

export type TabsVariant = "bar" | "pill";

const TabsVariantContext = createContext<{ readonly variant: TabsVariant }>({ variant: "bar" });

const styles = stylex.create({
  root: {
    color: colors.foreground,
    display: "flex",
    flexDirection: {
      default: "column",
      ":is([data-orientation=vertical])": "row",
    },
    gap: "1rem",
    minWidth: 0,
  },
  list: {
    display: "flex",
    flexDirection: {
      default: "row",
      ":is([data-orientation=vertical])": "column",
    },
    flexShrink: 0,
    position: "relative",
  },
  tab: {
    alignItems: "center",
    appearance: "none",
    backgroundColor: "transparent",
    borderStyle: "none",
    color: {
      default: colors.mutedForeground,
      ":hover": colors.foreground,
      ":is([data-active])": colors.foreground,
      ":is([data-disabled])": colors.subtleForeground,
    },
    cursor: {
      default: "pointer",
      ":is([data-disabled])": "not-allowed",
    },
    display: "inline-flex",
    fontFamily: "inherit",
    fontSize: typography.md,
    fontWeight: typography.medium,
    gap: "0.4rem",
    justifyContent: {
      default: "center",
      ":is([data-orientation=vertical])": "flex-start",
    },
    lineHeight: 1,
    minHeight: "2.5rem",
    opacity: {
      default: 1,
      ":is([data-disabled])": 0.55,
    },
    paddingInline: "0.85rem",
    position: "relative",
    transitionDuration: motion.fast,
    transitionProperty: "color",
    transitionTimingFunction: motion.easing,
    userSelect: "none",
    whiteSpace: "nowrap",
    // Keeps the label above the pill indicator, which sits in the same list.
    zIndex: 1,
    ":focus-visible": {
      outlineColor: colors.focus,
      outlineOffset: -2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
    "@media (pointer: coarse)": { minHeight: "2.75rem" },
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: 0,
    },
  },
  indicator: {
    left: 0,
    position: "absolute",
    top: 0,
    transitionDuration: motion.normal,
    transitionProperty: "translate, width, height",
    transitionTimingFunction: motion.easing,
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: 0,
      transitionProperty: "none",
    },
  },
  panel: {
    fontSize: typography.md,
    lineHeight: 1.6,
    minWidth: 0,
    ":focus-visible": {
      outlineColor: colors.focus,
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
});

/** A rule under the list, with a 2px bar under the active tab. */
const barStyles = stylex.create({
  list: {
    borderColor: colors.border,
    borderStyle: "solid",
    borderWidth: {
      default: "0 0 1px 0",
      ":is([data-orientation=vertical])": "0 1px 0 0",
    },
    gap: "0.25rem",
  },
  tab: {
    borderRadius: radii.sm,
    paddingInline: {
      default: "0.6rem",
      ":is([data-orientation=vertical])": "0.75rem 1rem",
    },
  },
  indicator: {
    backgroundColor: colors.primary,
    borderRadius: radii.full,
    // Horizontal: full tab width along the bottom edge. Vertical: full tab height along the
    // inline-end edge. `translate` follows the tab, the size follows its box.
    height: {
      default: "2px",
      ":is([data-orientation=vertical])": "var(--active-tab-height)",
    },
    translate: {
      default:
        "var(--active-tab-left) calc(var(--active-tab-top) + var(--active-tab-height) - 1px)",
      ":is([data-orientation=vertical])":
        "calc(var(--active-tab-left) + var(--active-tab-width) - 1px) var(--active-tab-top)",
    },
    width: {
      default: "var(--active-tab-width)",
      ":is([data-orientation=vertical])": "2px",
    },
  },
});

/** A sunken track with a raised pill behind the active tab. */
const pillStyles = stylex.create({
  list: {
    backgroundColor: colors.muted,
    borderColor: colors.border,
    borderRadius: radii.md,
    borderStyle: "solid",
    borderWidth: 1,
    gap: "0.125rem",
    padding: "0.1875rem",
    width: "fit-content",
  },
  tab: {
    borderRadius: radii.sm,
    minHeight: "2.125rem",
    "@media (pointer: coarse)": { minHeight: "2.75rem" },
  },
  indicator: {
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    boxShadow: shadows.sm,
    height: "var(--active-tab-height)",
    translate: "var(--active-tab-left) var(--active-tab-top)",
    width: "var(--active-tab-width)",
  },
});

type RootProps = Omit<TabsPrimitive.Root.Props, "class" | "style"> &
  StyleProps & {
    /** `bar` underlines the active tab. `pill` raises it out of a sunken track. */
    variant?: TabsVariant;
  };
type ListProps = Omit<TabsPrimitive.List.Props, "class" | "style"> & StyleProps;
type TabProps = Omit<TabsPrimitive.Tab.Props, "class" | "style"> & StyleProps;
type IndicatorProps = Omit<TabsPrimitive.Indicator.Props, "class" | "style"> & StyleProps;
type PanelProps = Omit<TabsPrimitive.Panel.Props, "class" | "style"> & StyleProps;

function Root(props: RootProps) {
  const primitiveProps = omit(props, "variant", "xstyle");
  const attrs = reactiveStyleAttributes(() => stylex.attrs(styles.root, props.xstyle));
  const context = {
    get variant() {
      return props.variant ?? "bar";
    },
  };
  return (
    <TabsVariantContext value={context}>
      <TabsPrimitive.Root {...mergeProps(attrs, primitiveProps)} />
    </TabsVariantContext>
  );
}

function List(props: ListProps) {
  const context = useContext(TabsVariantContext);
  const primitiveProps = omit(props, "xstyle");
  const attrs = reactiveStyleAttributes(() =>
    stylex.attrs(
      styles.list,
      context.variant === "bar" && barStyles.list,
      context.variant === "pill" && pillStyles.list,
      props.xstyle,
    ),
  );
  return <TabsPrimitive.List {...mergeProps(attrs, primitiveProps)} />;
}

function Tab(props: TabProps) {
  const context = useContext(TabsVariantContext);
  const primitiveProps = omit(props, "xstyle", "value");
  const attrs = reactiveStyleAttributes(() =>
    stylex.attrs(
      styles.tab,
      context.variant === "bar" && barStyles.tab,
      context.variant === "pill" && pillStyles.tab,
      props.xstyle,
    ),
  );
  return <TabsPrimitive.Tab value={props.value} {...mergeProps(attrs, primitiveProps)} />;
}

/** Place inside `Tabs.List`. It follows the active tab through the primitive's CSS variables. */
function Indicator(props: IndicatorProps) {
  const context = useContext(TabsVariantContext);
  const primitiveProps = omit(props, "xstyle");
  const attrs = reactiveStyleAttributes(() =>
    stylex.attrs(
      styles.indicator,
      context.variant === "bar" && barStyles.indicator,
      context.variant === "pill" && pillStyles.indicator,
      props.xstyle,
    ),
  );
  return <TabsPrimitive.Indicator {...mergeProps(attrs, primitiveProps)} />;
}

function Panel(props: PanelProps) {
  const primitiveProps = omit(props, "xstyle", "value");
  const attrs = reactiveStyleAttributes(() => stylex.attrs(styles.panel, props.xstyle));
  return <TabsPrimitive.Panel value={props.value} {...mergeProps(attrs, primitiveProps)} />;
}

export const Tabs = { Root, List, Tab, Indicator, Panel };
