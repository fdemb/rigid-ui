import * as stylex from "@stylexjs/stylex";
import { omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { AlertDialog as AlertDialogPrimitive } from "rigid-ui/primitives/alert-dialog";
import { Dialog as DialogPrimitive } from "rigid-ui/primitives/dialog";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import { tokens } from "../../styles/tokens.stylex";
import { Button, type ButtonAppearance } from "./Button";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

const styles = stylex.create({
  backdrop: {
    backgroundColor: tokens.backdrop,
    inset: 0,
    opacity: {
      default: 1,
      ":is([data-starting-style])": 0,
      ":is([data-ending-style])": 0,
    },
    position: "fixed",
    transitionDuration: tokens.durationNormal,
    transitionProperty: "opacity",
    transitionTimingFunction: tokens.easing,
  },
  popup: {
    backgroundColor: tokens.surfaceRaised,
    borderColor: tokens.border,
    borderRadius: tokens.radiusLg,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: tokens.shadowLg,
    color: tokens.text,
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
    inset: 0,
    margin: "auto",
    maxHeight: "min(42rem, calc(100vh - 2rem))",
    maxWidth: "calc(100vw - 2rem)",
    opacity: {
      default: 1,
      ":is([data-starting-style])": 0,
      ":is([data-ending-style])": 0,
    },
    outline: "none",
    overflow: "auto",
    padding: "1.25rem",
    position: "fixed",
    transform: {
      default: "scale(1) translateY(0)",
      ":is([data-starting-style])": "scale(0.97) translateY(0.4rem)",
      ":is([data-ending-style])": "scale(0.97) translateY(0.4rem)",
    },
    transitionDuration: tokens.durationNormal,
    transitionProperty: "opacity, transform",
    transitionTimingFunction: tokens.easing,
  },
  sm: { width: "24rem" },
  md: { width: "31rem" },
  lg: { width: "42rem" },
  title: {
    color: tokens.text,
    fontSize: "1rem",
    fontWeight: 700,
    letterSpacing: "-0.012em",
    lineHeight: 1.3,
    margin: 0,
  },
  description: {
    color: tokens.textMuted,
    fontSize: "0.875rem",
    lineHeight: 1.55,
    margin: 0,
  },
  footer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "0.6rem",
    justifyContent: "flex-end",
    marginTop: "0.45rem",
  },
});

type DialogTriggerProps = Parameters<typeof DialogPrimitive.Trigger>[0];
type DialogCloseProps = Parameters<typeof DialogPrimitive.Close>[0];
type DialogPopupProps = Parameters<typeof DialogPrimitive.Popup>[0];
type DialogTitleProps = Parameters<typeof DialogPrimitive.Title>[0];
type DialogDescriptionProps = Parameters<typeof DialogPrimitive.Description>[0];

type AlertDialogTriggerProps = Parameters<typeof AlertDialogPrimitive.Trigger>[0];
type AlertDialogCloseProps = Parameters<typeof AlertDialogPrimitive.Close>[0];
type AlertDialogPopupProps = Parameters<typeof AlertDialogPrimitive.Popup>[0];
type AlertDialogTitleProps = Parameters<typeof AlertDialogPrimitive.Title>[0];
type AlertDialogDescriptionProps = Parameters<typeof AlertDialogPrimitive.Description>[0];

interface ContentOptions extends StyleProps {
  children?: JSX.Element;
  size?: "sm" | "md" | "lg";
}

type DialogContentProps = Omit<DialogPopupProps, "class" | "style"> & ContentOptions;
type AlertDialogContentProps = Omit<AlertDialogPopupProps, "class" | "style"> & ContentOptions;

const sizes = { sm: styles.sm, md: styles.md, lg: styles.lg };

function DialogTrigger(
  props: DialogTriggerProps & ButtonAppearance & { xstyle?: stylex.StyleXStyles },
) {
  const primitiveProps = omit(props, "variant", "size", "xstyle");
  return (
    <DialogPrimitive.Trigger
      {...primitiveProps}
      render={(triggerProps) => (
        <Button {...triggerProps} size={props.size} variant={props.variant} xstyle={props.xstyle} />
      )}
    />
  );
}

function DialogClose(props: DialogCloseProps & ButtonAppearance) {
  const primitiveProps = omit(props, "variant", "size");
  return (
    <DialogPrimitive.Close
      {...primitiveProps}
      render={(closeProps) => (
        <Button {...closeProps} size={props.size} variant={props.variant ?? "secondary"} />
      )}
    />
  );
}

function DialogContent(props: DialogContentProps) {
  const popupProps = omit(props, "size", "xstyle");
  const popupStyles = reactiveStyleAttributes(() =>
    stylex.attrs(styles.popup, sizes[props.size ?? "md"], props.xstyle),
  );
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop {...stylex.attrs(styles.backdrop)} />
      <DialogPrimitive.Popup {...mergeProps(popupStyles, popupProps)} />
    </DialogPrimitive.Portal>
  );
}

function DialogTitle(props: DialogTitleProps) {
  return <DialogPrimitive.Title {...mergeProps(stylex.attrs(styles.title), props)} />;
}

function DialogDescription(props: DialogDescriptionProps) {
  return <DialogPrimitive.Description {...mergeProps(stylex.attrs(styles.description), props)} />;
}

function AlertTrigger(props: AlertDialogTriggerProps & ButtonAppearance) {
  const primitiveProps = omit(props, "variant", "size");
  return (
    <AlertDialogPrimitive.Trigger
      {...primitiveProps}
      render={(triggerProps) => (
        <Button {...triggerProps} size={props.size} variant={props.variant} />
      )}
    />
  );
}

function AlertClose(props: AlertDialogCloseProps & ButtonAppearance) {
  const primitiveProps = omit(props, "variant", "size");
  return (
    <AlertDialogPrimitive.Close
      {...primitiveProps}
      render={(closeProps) => (
        <Button {...closeProps} size={props.size} variant={props.variant ?? "secondary"} />
      )}
    />
  );
}

function AlertContent(props: AlertDialogContentProps) {
  const popupProps = omit(props, "size", "xstyle");
  const popupStyles = reactiveStyleAttributes(() =>
    stylex.attrs(styles.popup, sizes[props.size ?? "sm"], props.xstyle),
  );
  return (
    <AlertDialogPrimitive.Portal>
      <AlertDialogPrimitive.Backdrop {...stylex.attrs(styles.backdrop)} />
      <AlertDialogPrimitive.Popup {...mergeProps(popupStyles, popupProps)} />
    </AlertDialogPrimitive.Portal>
  );
}

function AlertTitle(props: AlertDialogTitleProps) {
  return <AlertDialogPrimitive.Title {...mergeProps(stylex.attrs(styles.title), props)} />;
}

function AlertDescription(props: AlertDialogDescriptionProps) {
  return (
    <AlertDialogPrimitive.Description {...mergeProps(stylex.attrs(styles.description), props)} />
  );
}

export function DialogFooter(props: JSX.HTMLAttributes<HTMLDivElement>) {
  return <div {...mergeProps(stylex.attrs(styles.footer), props)} />;
}

export const Dialog = {
  Root: DialogPrimitive.Root,
  Trigger: DialogTrigger,
  Content: DialogContent,
  Title: DialogTitle,
  Description: DialogDescription,
  Close: DialogClose,
};

export const AlertDialog = {
  Root: AlertDialogPrimitive.Root,
  Trigger: AlertTrigger,
  Content: AlertContent,
  Title: AlertTitle,
  Description: AlertDescription,
  Close: AlertClose,
};
