import * as stylex from "@stylexjs/stylex";
import { omit } from "solid-js";
import { mergeProps } from "rigid-ui/primitives/merge-props";
import { Tooltip as TooltipPrimitive } from "rigid-ui/primitives/tooltip";

import { colors, motion, radii, shadows, typography } from "./tokens.stylex";
import { Button, type ButtonAppearance } from "./Button";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

const styles = stylex.create({
  popup: {
    backgroundColor: colors.inverse,
    borderRadius: radii.sm,
    boxShadow: shadows.md,
    color: colors.inverseForeground,
    fontSize: typography.xs,
    fontWeight: typography.bold,
    lineHeight: typography.headingLineHeight,
    maxWidth: "16rem",
    opacity: {
      default: 1,
      ":is([data-starting-style])": 0,
      ":is([data-ending-style])": 0,
    },
    paddingBlock: "0.42rem",
    paddingInline: "0.58rem",
    transform: {
      default: "scale(1)",
      ":is([data-starting-style])": "scale(0.96)",
      ":is([data-ending-style])": "scale(0.96)",
    },
    transformOrigin: "var(--transform-origin)",
    transitionDuration: motion.fast,
    transitionProperty: "opacity, transform",
    transitionTimingFunction: motion.easing,
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: 0,
      transitionProperty: "none",
    },
  },
});

type TriggerProps = Parameters<typeof TooltipPrimitive.Trigger>[0];
type PopupProps = Parameters<typeof TooltipPrimitive.Popup>[0];
type PortalProps = Parameters<typeof TooltipPrimitive.Portal>[0];

interface TooltipContentProps extends Omit<PopupProps, "class" | "style">, StyleProps {
  container?: PortalProps["container"];
  sideOffset?: number;
}

function TooltipTrigger(props: TriggerProps & ButtonAppearance & { xstyle?: stylex.StyleXStyles }) {
  const primitiveProps = omit(props, "variant", "size", "xstyle");
  return (
    <TooltipPrimitive.Trigger
      {...primitiveProps}
      render={(triggerProps) => (
        <Button {...triggerProps} size={props.size} variant={props.variant} xstyle={props.xstyle} />
      )}
    />
  );
}

function TooltipContent(props: TooltipContentProps) {
  const popupProps = omit(props, "container", "sideOffset", "xstyle");
  const popupStyles = reactiveStyleAttributes(() => stylex.attrs(styles.popup, props.xstyle));
  return (
    <TooltipPrimitive.Portal container={props.container}>
      <TooltipPrimitive.Positioner sideOffset={props.sideOffset ?? 7}>
        <TooltipPrimitive.Popup {...mergeProps(popupStyles, popupProps)} />
      </TooltipPrimitive.Positioner>
    </TooltipPrimitive.Portal>
  );
}

export const Tooltip = {
  Provider: TooltipPrimitive.Provider,
  Root: TooltipPrimitive.Root,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
};
