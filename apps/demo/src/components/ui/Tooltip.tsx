import * as stylex from "@stylexjs/stylex";
import { omit } from "solid-js";
import { mergeProps } from "rigid-ui/primitives/merge-props";
import { Tooltip as TooltipPrimitive } from "rigid-ui/primitives/tooltip";

import { tokens } from "../../styles/tokens.stylex";
import { Button, type ButtonAppearance } from "./Button";
import { reactiveStyleAttributes, type StyleProps } from "./styleProps";

const styles = stylex.create({
  popup: {
    backgroundColor: tokens.text,
    borderRadius: tokens.radiusSm,
    boxShadow: tokens.shadowMd,
    color: tokens.surface,
    fontSize: "0.75rem",
    fontWeight: 650,
    lineHeight: 1.3,
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
    transitionDuration: tokens.durationFast,
    transitionProperty: "opacity, transform",
    transitionTimingFunction: tokens.easing,
    "@media (prefers-reduced-motion: reduce)": {
      transitionDuration: 0,
      transitionProperty: "none",
    },
  },
});

type TriggerProps = Parameters<typeof TooltipPrimitive.Trigger>[0];
type PopupProps = Parameters<typeof TooltipPrimitive.Popup>[0];

interface TooltipContentProps extends Omit<PopupProps, "class" | "style">, StyleProps {
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
  const popupProps = omit(props, "sideOffset", "xstyle");
  const popupStyles = reactiveStyleAttributes(() => stylex.attrs(styles.popup, props.xstyle));
  return (
    <TooltipPrimitive.Portal>
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
