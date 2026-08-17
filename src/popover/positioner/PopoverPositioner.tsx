import { createEffect, createSignal, createUniqueId, omit, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { usePopoverRootContext } from "../root/PopoverRootContext";
import { usePopoverPortalContext } from "../portal/PopoverPortalContext";
import {
  assignRef,
  callEventHandler,
  mergeStyles,
  type PopoverAlign,
  type PopoverAnchor,
  type PopoverCollisionAvoidance,
  type PopoverNativeProps,
  type PopoverOffset,
  type PopoverOffsetData,
  type PopoverSide,
} from "../types";
import {
  PopoverPositionerContext,
  type PopoverPositionerContextValue,
} from "./PopoverPositionerContext";

export type PopoverCollisionBoundary = "clipping-ancestors" | Element | Element[] | null;
export type PopoverCollisionPadding =
  | number
  | Partial<{ top: number; right: number; bottom: number; left: number }>;

export interface PopoverPositionerState {
  open: boolean;
  side: PopoverSide;
  align: PopoverAlign;
  anchorHidden: boolean;
  instant: string | undefined;
}

export interface PopoverPositionerProps extends PopoverNativeProps<HTMLDivElement> {
  anchor?: PopoverAnchor;
  positionMethod?: "absolute" | "fixed";
  side?: PopoverSide;
  sideOffset?: PopoverOffset;
  align?: PopoverAlign;
  alignOffset?: PopoverOffset;
  collisionBoundary?: PopoverCollisionBoundary;
  collisionPadding?: PopoverCollisionPadding;
  sticky?: boolean;
  arrowPadding?: number;
  disableAnchorTracking?: boolean;
  collisionAvoidance?: PopoverCollisionAvoidance;
}

function oppositeSide(side: PopoverSide): PopoverSide {
  if (side === "top") return "bottom";
  if (side === "bottom") return "top";
  if (side === "left") return "right";
  if (side === "right") return "left";
  return side === "inline-start" ? "inline-end" : "inline-start";
}

function oppositeAlign(align: PopoverAlign): PopoverAlign {
  if (align === "start") return "end";
  if (align === "end") return "start";
  return "center";
}

function perpendicularSides(
  side: PopoverSide,
  fallback: "start" | "end",
): [PopoverSide, PopoverSide] {
  const horizontal = side === "left" || side === "right" || side.startsWith("inline");
  if (horizontal) return fallback === "start" ? ["top", "bottom"] : ["bottom", "top"];
  return fallback === "start" ? ["inline-start", "inline-end"] : ["inline-end", "inline-start"];
}

function positionArea(side: PopoverSide, align: PopoverAlign, direction: "ltr" | "rtl") {
  const horizontalSide = side === "left" || side === "right" || side.startsWith("inline");
  if (align === "center") return `${side} span-all`;
  if (horizontalSide) {
    return align === "start" ? `${side} span-block-end` : `${side} span-block-start`;
  }
  const alignToRight = (align === "start") === (direction === "ltr");
  return alignToRight ? `${side} span-right` : `${side} span-left`;
}

function fallbackAreas(
  side: PopoverSide,
  align: PopoverAlign,
  avoidance: PopoverCollisionAvoidance,
  direction: "ltr" | "rtl",
) {
  const areas: string[] = [];
  const shouldFlipSide = avoidance.side !== "none" && avoidance.side !== "shift";
  const shouldFlipAlign =
    align !== "center" && avoidance.align !== "none" && avoidance.align !== "shift";
  if (shouldFlipSide) areas.push(positionArea(oppositeSide(side), align, direction));
  if (shouldFlipAlign) areas.push(positionArea(side, oppositeAlign(align), direction));
  if (shouldFlipSide && shouldFlipAlign) {
    areas.push(positionArea(oppositeSide(side), oppositeAlign(align), direction));
  }
  if (avoidance.fallbackAxisSide && avoidance.fallbackAxisSide !== "none") {
    for (const fallbackSide of perpendicularSides(side, avoidance.fallbackAxisSide)) {
      areas.push(positionArea(fallbackSide, align, direction));
    }
  }
  return areas.join(", ") || "none";
}

function resolveAnchor(anchor: PopoverAnchor | undefined) {
  const value = typeof anchor === "function" ? anchor() : anchor;
  if (value && "current" in value) return value.current;
  return value;
}

function collisionPaddingValue(padding: PopoverCollisionPadding | undefined) {
  if (typeof padding === "number") return Math.max(0, padding);
  return Math.max(
    0,
    padding?.top ?? 5,
    padding?.right ?? 5,
    padding?.bottom ?? 5,
    padding?.left ?? 5,
  );
}

export function PopoverPositioner(props: PopoverPositionerProps) {
  const context = usePopoverRootContext();
  const keepMounted = usePopoverPortalContext();
  if (keepMounted === null) {
    throw new Error("Rigid UI: <Popover.Positioner> must be used within <Popover.Portal>.");
  }

  const generatedId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "");
  const externalAnchorName = `--rigid-popover-external-anchor-${generatedId}`;
  const side = () => props.side ?? "bottom";
  const align = () => props.align ?? "center";
  const anchorElement = () => resolveAnchor(props.anchor) ?? context!.activeTrigger()?.element();
  const anchorName = () =>
    props.anchor !== undefined ? externalAnchorName : context!.activeTrigger()?.anchorName;
  const arrowPadding = () => props.arrowPadding ?? 5;
  const positionerContext: PopoverPositionerContextValue = {
    side,
    align,
    anchorName,
    arrowPadding,
  };
  const [element, setElement] = createSignal<HTMLDivElement>();
  const [measurementRevision, setMeasurementRevision] = createSignal(0);
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
    "sticky",
    "arrowPadding",
    "disableAnchorTracking",
    "collisionAvoidance",
    "style",
    "onPointerEnter",
    "onPointerLeave",
  );

  createEffect(
    () => [side(), align()] as const,
    ([currentSide, currentAlign]) => context!.setPosition(currentSide, currentAlign),
  );

  createEffect(
    () => [props.anchor !== undefined, anchorElement()] as const,
    ([hasExternalAnchor, anchor]) => {
      if (!hasExternalAnchor) return;
      if (!(anchor instanceof HTMLElement || anchor instanceof SVGElement)) {
        if (anchor != null) {
          throw new Error("Rigid UI: native Popover positioning requires an Element anchor.");
        }
        return;
      }
      const previousValue = anchor.style.getPropertyValue("anchor-name");
      const previousPriority = anchor.style.getPropertyPriority("anchor-name");
      anchor.style.setProperty("anchor-name", externalAnchorName);
      return () => {
        if (previousValue) anchor.style.setProperty("anchor-name", previousValue, previousPriority);
        else anchor.style.removeProperty("anchor-name");
      };
    },
  );

  createEffect(
    () => [anchorElement(), element()] as const,
    ([anchor, positioner]) => {
      if (!anchor || !positioner || typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(() => setMeasurementRevision((value) => value + 1));
      observer.observe(anchor);
      observer.observe(positioner);
      return () => observer.disconnect();
    },
  );

  function offsetData(): PopoverOffsetData {
    measurementRevision();
    const anchorRect = anchorElement()?.getBoundingClientRect();
    const positionerRect = element()?.getBoundingClientRect();
    return {
      anchor: { width: anchorRect?.width ?? 0, height: anchorRect?.height ?? 0 },
      positioner: { width: positionerRect?.width ?? 0, height: positionerRect?.height ?? 0 },
      side: side(),
      align: align(),
    };
  }

  function resolveOffset(offset: PopoverOffset | undefined) {
    return typeof offset === "function" ? offset(offsetData()) : (offset ?? 0);
  }

  function positionerStyle(): JSX.CSSProperties | string {
    const currentSide = side();
    const currentAlign = align();
    const sideOffset = resolveOffset(props.sideOffset);
    const alignOffset = resolveOffset(props.alignOffset);
    const padding = collisionPaddingValue(props.collisionPadding);
    const positionerRect = element()?.getBoundingClientRect();
    const direction: "ltr" | "rtl" =
      anchorElement() && getComputedStyle(anchorElement()!).direction === "rtl" ? "rtl" : "ltr";
    const inlineAlignment =
      currentAlign === "center"
        ? "anchor-center"
        : (currentAlign === "start") === (direction === "ltr")
          ? "start"
          : "end";
    const horizontalSide =
      currentSide === "left" || currentSide === "right" || currentSide.startsWith("inline");
    const transformOriginBySide: Record<PopoverSide, string> = {
      top: "bottom center",
      bottom: "top center",
      left: "right center",
      right: "left center",
      "inline-start": "right center",
      "inline-end": "left center",
    };
    const base: JSX.CSSProperties & Record<string, string | number | undefined> = {
      position: props.positionMethod ?? "absolute",
      "position-anchor": anchorName(),
      "position-area": positionArea(currentSide, currentAlign, direction),
      "position-try-fallbacks": fallbackAreas(
        currentSide,
        currentAlign,
        {
          side: "flip",
          align: "flip",
          fallbackAxisSide: "none",
          ...props.collisionAvoidance,
        },
        direction,
      ),
      "position-visibility": props.sticky ? "always" : "anchors-visible",
      "justify-self": horizontalSide ? undefined : inlineAlignment,
      "align-self": horizontalSide
        ? currentAlign === "center"
          ? "anchor-center"
          : currentAlign
        : undefined,
      "margin-top": currentSide === "bottom" ? `${sideOffset}px` : undefined,
      "margin-bottom": currentSide === "top" ? `${sideOffset}px` : undefined,
      "margin-left":
        currentSide === "right" || currentSide === "inline-end" ? `${sideOffset}px` : undefined,
      "margin-right":
        currentSide === "left" || currentSide === "inline-start" ? `${sideOffset}px` : undefined,
      translate: horizontalSide ? `0 ${alignOffset}px` : `${alignOffset}px 0`,
      "--available-width": `calc(100dvw - ${padding * 2}px)`,
      "--available-height": `calc(100dvh - ${padding * 2}px)`,
      "--anchor-width": "anchor-size(width)",
      "--anchor-height": "anchor-size(height)",
      "--transform-origin": transformOriginBySide[currentSide],
      "--positioner-width": `${positionerRect?.width ?? 0}px`,
      "--positioner-height": `${positionerRect?.height ?? 0}px`,
    };
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
          hidden={!context!.mounted()}
          inert={!context!.open() ? true : undefined}
          data-open={context!.open() ? "" : undefined}
          data-closed={!context!.open() ? "" : undefined}
          data-side={side()}
          data-align={align()}
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
