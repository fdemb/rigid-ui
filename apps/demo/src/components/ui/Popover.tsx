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
    transform: {
      default: "scale(1) translateY(0)",
      ":is([data-starting-style])": "scale(0.97) translateY(0.35rem)",
      ":is([data-ending-style])": "scale(0.97) translateY(0.35rem)",
    },
    transformOrigin: "var(--transform-origin)",
    transitionDuration: tokens.durationNormal,
    transitionProperty: "opacity, transform",
    transitionTimingFunction: tokens.easing,
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
  const popupProps = omit(props, "align", "sideOffset", "xstyle");
  const popupStyles = reactiveStyleAttributes(() => stylex.attrs(styles.popup, props.xstyle));
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        align={props.align ?? "center"}
        sideOffset={props.sideOffset ?? 8}
      >
        <PopoverPrimitive.Popup {...mergeProps(popupStyles, popupProps)} />
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

export const Popover = {
  Root: PopoverPrimitive.Root,
  Trigger: PopoverTrigger,
  Content: PopoverContent,
  Title: PopoverTitle,
  Description: PopoverDescription,
  Close: PopoverClose,
};
