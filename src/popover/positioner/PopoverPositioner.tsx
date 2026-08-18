import { createEffect, createSignal, omit, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { usePopoverRootContext } from "../root/PopoverRootContext";
import { usePopoverPortalContext } from "../portal/PopoverPortalContext";
import {
  assignRef,
  callEventHandler,
  mergeStyles,
  type PopoverAlign,
  type PopoverAnchor,
  type PopoverBoundary,
  type PopoverCollisionAvoidance,
  type PopoverCollisionPadding,
  type PopoverNativeProps,
  type PopoverOffset,
  type PopoverSide,
} from "../types";
import {
  createAnchorPositioning,
  DEFAULT_COLLISION_AVOIDANCE,
} from "../../utils/createAnchorPositioning";
import {
  PopoverPositionerContext,
  type PopoverPositionerContextValue,
} from "./PopoverPositionerContext";

export interface PopoverPositionerState {
  open: boolean;
  side: PopoverSide;
  align: PopoverAlign;
  anchorHidden: boolean;
  instant: string | undefined;
}

export interface PopoverPositionerProps extends PopoverNativeProps<HTMLDivElement> {
  /** An element to position the popup against. Defaults to the active trigger. */
  anchor?: PopoverAnchor;
  positionMethod?: "absolute" | "fixed";
  side?: PopoverSide;
  sideOffset?: PopoverOffset;
  align?: PopoverAlign;
  alignOffset?: PopoverOffset;
  /** The area the popup is confined to. @default 'clipping-ancestors' */
  collisionBoundary?: PopoverBoundary;
  /** Space to maintain from the edge of the collision boundary. @default 5 */
  collisionPadding?: PopoverCollisionPadding;
  /** How to resolve collisions on the side and align axes. */
  collisionAvoidance?: PopoverCollisionAvoidance;
  /** Minimum distance between the arrow and the popup's edges. @default 5 */
  arrowPadding?: number;
  /** Keep the popup in the viewport after the anchor is scrolled out of view. */
  sticky?: boolean;
  /** Stop tracking layout shifts of the anchor. */
  disableAnchorTracking?: boolean;
}

export function PopoverPositioner(props: PopoverPositionerProps) {
  const context = usePopoverRootContext();
  const keepMounted = usePopoverPortalContext();
  if (keepMounted === null) {
    throw new Error("Rigid UI: <Popover.Positioner> must be used within <Popover.Portal>.");
  }

  const [element, setElement] = createSignal<HTMLDivElement>();
  const [arrowElement, setArrowElement] = createSignal<Element>();

  const positioning = createAnchorPositioning({
    anchor: () => props.anchor ?? context!.activeTrigger()?.element(),
    positioner: element,
    arrow: arrowElement,
    mounted: () => context!.mounted() || keepMounted,
    positionMethod: () => props.positionMethod ?? "absolute",
    side: () => props.side ?? "bottom",
    sideOffset: () => props.sideOffset ?? 0,
    align: () => props.align ?? "center",
    alignOffset: () => props.alignOffset ?? 0,
    collisionBoundary: () => props.collisionBoundary ?? "clipping-ancestors",
    collisionPadding: () => props.collisionPadding ?? 5,
    collisionAvoidance: () => props.collisionAvoidance ?? DEFAULT_COLLISION_AVOIDANCE,
    sticky: () => props.sticky ?? false,
    arrowPadding: () => props.arrowPadding ?? 5,
    disableAnchorTracking: () => props.disableAnchorTracking ?? false,
  });

  const positionerContext: PopoverPositionerContextValue = {
    side: positioning.side,
    align: positioning.align,
    arrowStyles: positioning.arrowStyles,
    arrowUncentered: positioning.arrowUncentered,
    setArrowElement,
  };

  const others = omit(
    props,
    "ref",
    "children",
    "anchor",
    "positionMethod",
    "side",
    "sideOffset",
    "align",
    "alignOffset",
    "collisionBoundary",
    "collisionPadding",
    "collisionAvoidance",
    "arrowPadding",
    "sticky",
    "disableAnchorTracking",
    "style",
    "onPointerEnter",
    "onPointerLeave",
  );

  createEffect(
    () => [positioning.side(), positioning.align()] as const,
    ([currentSide, currentAlign]) => context!.setPosition(currentSide, currentAlign),
  );

  function positionerStyle(): JSX.CSSProperties | string {
    const base: JSX.CSSProperties & Record<string, string | number | undefined> = {
      ...positioning.positionerStyles(),
    };
    if (!context!.open()) {
      base["pointer-events"] = "none";
    }
    return mergeStyles(base, props.style);
  }

  function handlePointerEnter(event: PointerEvent) {
    callEventHandler(props.onPointerEnter, event);
    context!.cancelHoverClose();
  }

  function handlePointerLeave(event: PointerEvent) {
    callEventHandler(props.onPointerLeave, event);
    const trigger = context!.activeTrigger();
    if (!trigger?.openOnHover()) return;
    context!.scheduleHoverClose(trigger.id, event, trigger.closeDelay());
  }

  return (
    <Show when={context!.mounted() || keepMounted}>
      <PopoverPositionerContext value={positionerContext}>
        <div
          {...others}
          ref={(node) => {
            setElement(node);
            context!.setPositionerElement(node);
            assignRef(props.ref, node);
          }}
          role="presentation"
          hidden={!context!.mounted()}
          inert={!context!.open() ? true : undefined}
          data-open={context!.open() ? "" : undefined}
          data-closed={!context!.open() ? "" : undefined}
          data-side={positioning.side()}
          data-align={positioning.align()}
          data-anchor-hidden={positioning.anchorHidden() ? "" : undefined}
          style={positionerStyle()}
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
        >
          {props.children}
        </div>
      </PopoverPositionerContext>
    </Show>
  );
}

export namespace PopoverPositioner {
  export type State = PopoverPositionerState;
  export type Props = PopoverPositionerProps;
}
