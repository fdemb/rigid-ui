import { createEffect, createSignal, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useTooltipPortalContext } from "../portal/TooltipPortalContext";
import { useTooltipRootContext } from "../root/TooltipRootContext";
import { renderPart } from "../../internals/renderPart";
import { popupStateMapping } from "../../utils/popupStateMapping";
import type {
  TooltipAlign,
  TooltipAnchor,
  TooltipBoundary,
  TooltipCollisionAvoidance,
  TooltipCollisionPadding,
  TooltipInstantType,
  TooltipNativeProps,
  TooltipOffset,
  TooltipSide,
} from "../types";
import {
  createAnchorPositioning,
  DEFAULT_COLLISION_AVOIDANCE,
} from "../../utils/createAnchorPositioning";
import {
  TooltipPositionerContext,
  type TooltipPositionerContextValue,
} from "./TooltipPositionerContext";

export interface TooltipPositionerState {
  open: boolean;
  side: TooltipSide;
  align: TooltipAlign;
  anchorHidden: boolean;
  instant: TooltipInstantType | "tracking-cursor";
}

export interface TooltipPositionerProps extends TooltipNativeProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  TooltipPositionerState
> {
  /** An element to position the popup against. Defaults to the active trigger. */
  anchor?: TooltipAnchor;
  positionMethod?: "absolute" | "fixed";
  side?: TooltipSide;
  sideOffset?: TooltipOffset;
  align?: TooltipAlign;
  alignOffset?: TooltipOffset;
  /** The area the popup is confined to. @default 'clipping-ancestors' */
  collisionBoundary?: TooltipBoundary;
  /** Space to maintain from the edge of the collision boundary. @default 5 */
  collisionPadding?: TooltipCollisionPadding;
  /** How to resolve collisions on the side and align axes. */
  collisionAvoidance?: TooltipCollisionAvoidance;
  /** Minimum distance between the arrow and the popup's edges. @default 5 */
  arrowPadding?: number;
  /** Keep the popup in the viewport after the anchor is scrolled out of view. */
  sticky?: boolean;
  /** Stop tracking layout shifts of the anchor. */
  disableAnchorTracking?: boolean;
}

export function TooltipPositioner(props: TooltipPositionerProps) {
  const context = useTooltipRootContext();
  const keepMounted = useTooltipPortalContext();
  if (keepMounted === null) {
    throw new Error("Rigid UI: <Tooltip.Positioner> must be used within <Tooltip.Portal>.");
  }

  const [element, setElement] = createSignal<HTMLDivElement>();
  const [arrowElement, setArrowElement] = createSignal<Element>();
  const [viewportCount, setViewportCount] = createSignal(0);

  const resolvedAnchor = () => {
    if (props.anchor != null) return props.anchor;
    const tracking = context!.cursorTracking.view();
    return tracking.kind === "active" ? tracking.anchor : context!.activeTrigger()?.element();
  };

  const positioning = createAnchorPositioning({
    anchor: resolvedAnchor,
    positioner: element,
    arrow: arrowElement,
    mounted: () => context!.mounted() || keepMounted.keepMounted,
    positionMethod: () => props.positionMethod ?? "absolute",
    side: () => props.side ?? "top",
    sideOffset: () => props.sideOffset ?? 0,
    align: () => props.align ?? "center",
    alignOffset: () => props.alignOffset ?? 0,
    collisionBoundary: () => props.collisionBoundary ?? "clipping-ancestors",
    collisionPadding: () => props.collisionPadding ?? 5,
    collisionAvoidance: () => props.collisionAvoidance ?? DEFAULT_COLLISION_AVOIDANCE,
    sticky: () => props.sticky ?? false,
    arrowPadding: () => props.arrowPadding ?? 5,
    disableAnchorTracking: () => props.disableAnchorTracking ?? false,
    useTopLeft: () => viewportCount() > 0,
  });

  const positionerContext: TooltipPositionerContextValue = {
    side: positioning.side,
    physicalSide: positioning.physicalSide,
    align: positioning.align,
    arrowStyles: positioning.arrowStyles,
    arrowUncentered: positioning.arrowUncentered,
    setArrowElement,
    registerViewport() {
      setViewportCount((count) => count + 1);
      return () => setViewportCount((count) => Math.max(0, count - 1));
    },
  };

  // Until the first pass lands the positioner sits at the origin with no transform, so enabling
  // a positional transition at that moment would animate the popup in from the top-left corner.
  const [transitionsReady, setTransitionsReady] = createSignal(false);

  createEffect(
    () => positioning.isPositioned(),
    (positioned) => {
      if (!positioned) {
        setTransitionsReady(false);
        return;
      }
      if (typeof requestAnimationFrame === "undefined") {
        setTransitionsReady(true);
        return;
      }
      const frame = requestAnimationFrame(() => setTransitionsReady(true));
      return () => cancelAnimationFrame(frame);
    },
  );

  function handlePointerEnter() {
    context!.cancelHoverClose();
  }

  function handlePointerLeave(event: PointerEvent) {
    const trigger = context!.activeTrigger();
    if (!trigger) return;
    context!.scheduleHoverClose(trigger.id, event, trigger.closeDelay());
  }

  return (
    <Show when={context!.mounted() || keepMounted.keepMounted}>
      <TooltipPositionerContext value={positionerContext}>
        {renderPart<HTMLDivElement, TooltipPositionerState>("div", props, {
          state: () => ({
            open: context!.open(),
            side: positioning.side(),
            align: positioning.align(),
            anchorHidden: positioning.anchorHidden(),
            instant:
              context!.trackCursorAxis() === "none" ? context!.instantType() : "tracking-cursor",
          }),
          stateAttributesMapping: popupStateMapping,
          props: {
            role: "presentation",
            get hidden() {
              return !context!.mounted();
            },
            get inert() {
              return !context!.open() ||
                context!.trackCursorAxis() === "both" ||
                context!.disableHoverablePopup()
                ? true
                : undefined;
            },
            get style(): JSX.CSSProperties | string {
              const base: JSX.CSSProperties & Record<string, string | number | undefined> = {
                ...positioning.positionerStyles(),
              };
              if (!transitionsReady()) {
                base.transition = "none";
              }
              // A hoverable popup lets the pointer travel onto it without closing, unless
              // `disableHoverablePopup` opted out.
              if (
                !context!.open() ||
                context!.trackCursorAxis() === "both" ||
                context!.disableHoverablePopup()
              ) {
                base["pointer-events"] = "none";
              }
              return base;
            },
            onPointerEnter: handlePointerEnter,
            onPointerLeave: handlePointerLeave,
          },
          ref: [setElement, (node: HTMLDivElement) => context!.setPositionerElement(node)],
          exclude: [
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
          ],
        })}
      </TooltipPositionerContext>
    </Show>
  );
}

export namespace TooltipPositioner {
  export type State = TooltipPositionerState;
  export type Props = TooltipPositionerProps;
}
