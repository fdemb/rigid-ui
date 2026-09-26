import * as stylex from "@stylexjs/stylex";
import { createContext, omit, useContext, type Accessor } from "solid-js";
import type { JSX } from "@solidjs/web";
import { AlertDialog as AlertDialogPrimitive } from "rigid-ui/primitives/alert-dialog";
import { Dialog as DialogPrimitive } from "rigid-ui/primitives/dialog";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import { colors, motion, radii, shadows, typography } from "./tokens.stylex";
import { Button, type ButtonAppearance } from "./Button";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

const styles = stylex.create({
  backdrop: {
    backgroundColor: colors.backdrop,
    inset: 0,
    opacity: {
      default: 1,
      ":is([data-starting-style])": 0,
      ":is([data-ending-style])": 0,
    },
    position: "fixed",
    transitionDuration: motion.normal,
    transitionProperty: "opacity",
    transitionTimingFunction: motion.easing,
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: 0,
      transitionProperty: "none",
    },
  },
  popup: {
    backgroundColor: colors.overlay,
    borderColor: colors.border,
    borderRadius: radii.lg,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: shadows.lg,
    color: colors.overlayForeground,
    display: "flex",
    flexDirection: "column",
    gap: "0.7rem",
    left: "50%",
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
    top: "50%",
    transform: {
      default: "translate(-50%, -50%) scale(1)",
      ":is([data-starting-style])": "translate(-50%, calc(-50% + 0.4rem)) scale(0.97)",
      ":is([data-ending-style])": "translate(-50%, calc(-50% + 0.4rem)) scale(0.97)",
    },
    transitionDuration: motion.normal,
    transitionProperty: "opacity, transform",
    transitionTimingFunction: motion.easing,
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: 0,
      transitionProperty: "none",
    },
  },
  sm: { width: "24rem" },
  md: { width: "31rem" },
  lg: { width: "42rem" },
  title: {
    fontSize: typography.lg,
    fontWeight: typography.bold,
    letterSpacing: "-0.012em",
    lineHeight: typography.headingLineHeight,
    margin: 0,
  },
  description: {
    color: colors.mutedForeground,
    fontSize: typography.md,
    lineHeight: typography.bodyLineHeight,
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
type DialogRootProps = Parameters<typeof DialogPrimitive.Root>[0];
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
  container?: Parameters<typeof DialogPrimitive.Portal>[0]["container"];
  children?: JSX.Element;
  size?: "sm" | "md" | "lg";
}

type DialogContentProps = Omit<DialogPopupProps, "class" | "style"> & ContentOptions;
type AlertDialogContentProps = Omit<AlertDialogPopupProps, "class" | "style"> & ContentOptions;

const sizes = { sm: styles.sm, md: styles.md, lg: styles.lg };

type DialogModal = NonNullable<DialogRootProps["modal"]>;

const DialogModalContext = createContext<Accessor<DialogModal>>();

function DialogRoot(props: DialogRootProps) {
  const modal = () => props.modal ?? true;
  return (
    <DialogModalContext value={modal}>
      <DialogPrimitive.Root {...props} />
    </DialogModalContext>
  );
}

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

function DialogClose(props: DialogCloseProps & ButtonAppearance & StyleProps) {
  const primitiveProps = omit(props, "variant", "size", "xstyle");
  return (
    <DialogPrimitive.Close
      {...primitiveProps}
      render={(closeProps) => (
        <Button
          {...closeProps}
          size={props.size}
          variant={props.variant ?? "secondary"}
          xstyle={props.xstyle}
        />
      )}
    />
  );
}

function DialogContent(props: DialogContentProps) {
  const modal = useContext(DialogModalContext);
  const popupProps = omit(props, "container", "size", "xstyle");
  const popupStyles = reactiveStyleAttributes(() =>
    stylex.attrs(styles.popup, sizes[props.size ?? "md"], props.xstyle),
  );
  return (
    <DialogPrimitive.Portal container={props.container}>
      {modal?.() !== false && <DialogPrimitive.Backdrop {...stylex.attrs(styles.backdrop)} />}
      <DialogPrimitive.Popup {...mergeProps(popupStyles, popupProps)} />
    </DialogPrimitive.Portal>
  );
}

function DialogTitle(props: DialogTitleProps & StyleProps) {
  const primitiveProps = omit(props, "xstyle");
  const attrs = reactiveStyleAttributes(() => stylex.attrs(styles.title, props.xstyle));
  return <DialogPrimitive.Title {...mergeProps(attrs, primitiveProps)} />;
}

function DialogDescription(props: DialogDescriptionProps & StyleProps) {
  const primitiveProps = omit(props, "xstyle");
  const attrs = reactiveStyleAttributes(() => stylex.attrs(styles.description, props.xstyle));
  return <DialogPrimitive.Description {...mergeProps(attrs, primitiveProps)} />;
}

function AlertTrigger(props: AlertDialogTriggerProps & ButtonAppearance & StyleProps) {
  const primitiveProps = omit(props, "variant", "size", "xstyle");
  return (
    <AlertDialogPrimitive.Trigger
      {...primitiveProps}
      render={(triggerProps) => (
        <Button {...triggerProps} size={props.size} variant={props.variant} xstyle={props.xstyle} />
      )}
    />
  );
}

function AlertClose(props: AlertDialogCloseProps & ButtonAppearance & StyleProps) {
  const primitiveProps = omit(props, "variant", "size", "xstyle");
  return (
    <AlertDialogPrimitive.Close
      {...primitiveProps}
      render={(closeProps) => (
        <Button
          {...closeProps}
          size={props.size}
          variant={props.variant ?? "secondary"}
          xstyle={props.xstyle}
        />
      )}
    />
  );
}

function AlertContent(props: AlertDialogContentProps) {
  const popupProps = omit(props, "container", "size", "xstyle");
  const popupStyles = reactiveStyleAttributes(() =>
    stylex.attrs(styles.popup, sizes[props.size ?? "sm"], props.xstyle),
  );
  return (
    <AlertDialogPrimitive.Portal container={props.container}>
      <AlertDialogPrimitive.Backdrop {...stylex.attrs(styles.backdrop)} />
      <AlertDialogPrimitive.Popup {...mergeProps(popupStyles, popupProps)} />
    </AlertDialogPrimitive.Portal>
  );
}

function AlertTitle(props: AlertDialogTitleProps & StyleProps) {
  const primitiveProps = omit(props, "xstyle");
  const attrs = reactiveStyleAttributes(() => stylex.attrs(styles.title, props.xstyle));
  return <AlertDialogPrimitive.Title {...mergeProps(attrs, primitiveProps)} />;
}

function AlertDescription(props: AlertDialogDescriptionProps & StyleProps) {
  const primitiveProps = omit(props, "xstyle");
  const attrs = reactiveStyleAttributes(() => stylex.attrs(styles.description, props.xstyle));
  return <AlertDialogPrimitive.Description {...mergeProps(attrs, primitiveProps)} />;
}

export function DialogFooter(props: JSX.HTMLAttributes<HTMLDivElement> & StyleProps) {
  const elementProps = omit(props, "xstyle");
  const attrs = reactiveStyleAttributes(() => stylex.attrs(styles.footer, props.xstyle));
  return <div {...mergeProps(attrs, elementProps)} />;
}

export const Dialog = {
  Root: DialogRoot,
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
