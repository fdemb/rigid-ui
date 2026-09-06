import * as stylex from "@stylexjs/stylex";
import { omit } from "solid-js";
import { mergeProps } from "rigid-ui/primitives/merge-props";
import { Popover as PopoverPrimitive } from "rigid-ui/primitives/popover";

import { tokens } from "../../styles/tokens.stylex";
import { Button, type ButtonAppearance } from "./Button";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

const styles = stylex.create({
  popup: {
    backgroundColor: tokens.surfaceRaised,
    borderColor: tokens.border,
    borderRadius: tokens.radiusLg,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: tokens.shadowMd,
    color: tokens.text,
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
    transitionDuration: tokens.durationNormal,
    transitionProperty: "opacity, transform",
    transitionTimingFunction: tokens.easing,
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
    borderColor: "inherit",
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
      backgroundColor: tokens.surfaceRaised,
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
    fontSize: "0.875rem",
    fontWeight: 700,
    lineHeight: 1.35,
    margin: 0,
  },
  description: {
    color: tokens.textMuted,
    fontSize: "0.82rem",
    lineHeight: 1.5,
    margin: 0,
  },
});

type TriggerProps = Parameters<typeof PopoverPrimitive.Trigger>[0];
type CloseProps = Parameters<typeof PopoverPrimitive.Close>[0];
type PopupProps = Parameters<typeof PopoverPrimitive.Popup>[0];
type TitleProps = Parameters<typeof PopoverPrimitive.Title>[0];
type DescriptionProps = Parameters<typeof PopoverPrimitive.Description>[0];

interface PopoverContentProps extends Omit<PopupProps, "class" | "style">, StyleProps {
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
  const popupProps = omit(props, "align", "children", "sideOffset", "xstyle");
  const popupStyles = reactiveStyleAttributes(() => stylex.attrs(styles.popup, props.xstyle));
  return (
    <PopoverPrimitive.Portal>
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

function PopoverTitle(props: TitleProps) {
  return <PopoverPrimitive.Title {...mergeProps(stylex.attrs(styles.title), props)} />;
}

function PopoverDescription(props: DescriptionProps) {
  return <PopoverPrimitive.Description {...mergeProps(stylex.attrs(styles.description), props)} />;
}

function PopoverClose(props: CloseProps & ButtonAppearance) {
  const primitiveProps = omit(props, "variant", "size");
  return (
    <PopoverPrimitive.Close
      {...primitiveProps}
      render={(closeProps) => (
        <Button {...closeProps} size={props.size ?? "sm"} variant={props.variant ?? "ghost"} />
      )}
    />
  );
}

/**
 * The arrow recipe as a bare style, for popups composed straight from the
 * primitive rather than through `Popover.Content`. The popup it points at needs
 * the same surface and border tokens, and a containing block of its own.
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
