import * as stylex from "@stylexjs/stylex";
import { omit } from "solid-js";
import { mergeProps } from "rigid-ui/primitives/merge-props";
import { Popover as PopoverPrimitive } from "rigid-ui/primitives/popover";

import { colors, motion, radii, shadows, typography } from "./tokens.stylex";
import { Button, type ButtonAppearance } from "./Button";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

const styles = stylex.create({
  popup: {
    backgroundColor: colors.overlay,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: shadows.md,
    color: colors.overlayForeground,
    display: "flex",
    flexDirection: "column",
    gap: "0.55rem",
    maxWidth: "min(22rem, var(--available-width))",
    opacity: {
      default: 1,
      ":is([data-starting-style])": 0,
      ":is([data-ending-style])": 0,
    },
    outline: "none",
    padding: "0.9rem",
    // The arrow positions itself against this element, so it has to be the
    // containing block. The transform below already makes it one; saying so
    // explicitly keeps that true if the animation is ever dropped.
    position: "relative",
    transform: {
      default: "scale(1) translateY(0)",
      ":is([data-starting-style])": "scale(0.97) translateY(0.35rem)",
      ":is([data-ending-style])": "scale(0.97) translateY(0.35rem)",
    },
    transformOrigin: "var(--transform-origin)",
    transitionDuration: motion.normal,
    transitionProperty: "opacity, transform",
    transitionTimingFunction: motion.easing,
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: 0,
      transitionProperty: "none",
    },
  },
  /*
   * A square rotated 45 degrees, cropped by this box down to the two edges that
   * face away from the popup, so the arrow picks up the popup's border. The
   * positioner writes the cross-axis offset inline (`left` on a top or bottom
   * side, `top` on a left or right one), which is why each offset below is
   * scoped to the sides that leave its property alone. Quarter-turning the
   * 12x6 box swaps its width and height, so the left and right sides sit 3px
   * further out to stay flush.
   */
  arrow: {
    backgroundColor: "inherit",
    borderColor: "inherit",
    clipPath: "polygon(50% 0, 100% 100%, 0 100%)",
    bottom: { default: null, ":is([data-side=top])": "-0.375rem" },
    display: "block",
    height: "0.375rem",
    left: { default: null, ":is([data-side=right])": "-0.5625rem" },
    overflow: "clip",
    right: { default: null, ":is([data-side=left])": "-0.5625rem" },
    top: { default: null, ":is([data-side=bottom])": "-0.375rem" },
    transform: {
      default: "rotate(0deg)",
      ":is([data-side=top])": "rotate(180deg)",
      ":is([data-side=left])": "rotate(90deg)",
      ":is([data-side=right])": "rotate(-90deg)",
    },
    width: "0.75rem",
    "::before": {
      backgroundColor: "inherit",
      // Inherited from the popup through the arrow, so an `xstyle` that
      // recolors the popup's border recolors the arrow's edges with it.
      borderColor: "inherit",
      borderStyle: "solid",
      borderWidth: 1,
      bottom: 0,
      boxSizing: "border-box",
      content: "",
      display: "block",
      height: "calc(0.375rem * sqrt(2))",
      left: "50%",
      position: "absolute",
      transform: "translate(-50%, 50%) rotate(45deg)",
      width: "calc(0.375rem * sqrt(2))",
    },
  },
  title: {
    fontSize: typography.md,
    fontWeight: typography.bold,
    lineHeight: typography.headingLineHeight,
    margin: 0,
  },
  description: {
    color: colors.mutedForeground,
    fontSize: typography.sm,
    lineHeight: typography.bodyLineHeight,
    margin: 0,
  },
});

type TriggerProps = Parameters<typeof PopoverPrimitive.Trigger>[0];
type CloseProps = Parameters<typeof PopoverPrimitive.Close>[0];
type PopupProps = Parameters<typeof PopoverPrimitive.Popup>[0];
type TitleProps = Parameters<typeof PopoverPrimitive.Title>[0];
type DescriptionProps = Parameters<typeof PopoverPrimitive.Description>[0];
type PortalProps = Parameters<typeof PopoverPrimitive.Portal>[0];

interface PopoverContentProps extends Omit<PopupProps, "class" | "style">, StyleProps {
  container?: PortalProps["container"];
  align?: "start" | "center" | "end";
  sideOffset?: number;
}

function PopoverTrigger(props: TriggerProps & ButtonAppearance & { xstyle?: stylex.StyleXStyles }) {
  const primitiveProps = omit(props, "variant", "size", "xstyle");
  return (
    <PopoverPrimitive.Trigger
      {...primitiveProps}
      render={(triggerProps) => (
        <Button {...triggerProps} size={props.size} variant={props.variant} xstyle={props.xstyle} />
      )}
    />
  );
}

function PopoverContent(props: PopoverContentProps) {
  const popupProps = omit(props, "align", "children", "container", "sideOffset", "xstyle");
  const popupStyles = reactiveStyleAttributes(() => stylex.attrs(styles.popup, props.xstyle));
  return (
    <PopoverPrimitive.Portal container={props.container}>
      <PopoverPrimitive.Positioner
        align={props.align ?? "center"}
        sideOffset={props.sideOffset ?? 8}
      >
        <PopoverPrimitive.Popup {...mergeProps(popupStyles, popupProps)}>
          <PopoverPrimitive.Arrow {...stylex.attrs(styles.arrow)} />
          {props.children}
        </PopoverPrimitive.Popup>
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  );
}

function PopoverTitle(props: TitleProps & StyleProps) {
  const primitiveProps = omit(props, "xstyle");
  const attrs = reactiveStyleAttributes(() => stylex.attrs(styles.title, props.xstyle));
  return <PopoverPrimitive.Title {...mergeProps(attrs, primitiveProps)} />;
}

function PopoverDescription(props: DescriptionProps & StyleProps) {
  const primitiveProps = omit(props, "xstyle");
  const attrs = reactiveStyleAttributes(() => stylex.attrs(styles.description, props.xstyle));
  return <PopoverPrimitive.Description {...mergeProps(attrs, primitiveProps)} />;
}

function PopoverClose(props: CloseProps & ButtonAppearance & StyleProps) {
  const primitiveProps = omit(props, "variant", "size", "xstyle");
  return (
    <PopoverPrimitive.Close
      {...primitiveProps}
      render={(closeProps) => (
        <Button
          {...closeProps}
          size={props.size ?? "sm"}
          variant={props.variant ?? "ghost"}
          xstyle={props.xstyle}
        />
      )}
    />
  );
}

/**
 * The arrow recipe as a bare style, for popups composed straight from the
 * primitive rather than through `Popover.Content`. The arrow inherits its fill
 * and border from the popup, which must establish a containing block.
 */
export const popoverArrowStyle = styles.arrow;

export const Popover = {
  Root: PopoverPrimitive.Root,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Title: PopoverTitle,
  Description: PopoverDescription,
  Close: PopoverClose,
};
