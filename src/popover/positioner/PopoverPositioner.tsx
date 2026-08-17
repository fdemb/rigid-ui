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
  type PopoverNativeProps,
  type PopoverOffset,
  type PopoverOffsetData,
  type PopoverSide,
} from "../types";
import {
  PopoverPositionerContext,
  type PopoverPositionerContextValue,
} from "./PopoverPositionerContext";

// Padding for the available-size CSS variables; it does not alter native collision detection.
export type PopoverAvailableSizePadding =
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
  availableSizePadding?: PopoverAvailableSizePadding;
  sticky?: boolean;
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

function fallbackPlacements(side: PopoverSide, align: PopoverAlign) {
  const placements = [{ side: oppositeSide(side), align }];
  if (align !== "center") {
    placements.push({ side, align: oppositeAlign(align) });
    placements.push({ side: oppositeSide(side), align: oppositeAlign(align) });
  }
  return placements;
}

function resolveAnchor(anchor: PopoverAnchor | undefined) {
  const value = typeof anchor === "function" ? anchor() : anchor;
  if (value && "current" in value) return value.current;
  return value;
}

function availableSizePaddingValue(padding: PopoverAvailableSizePadding | undefined) {
  const fallback = typeof padding === "number" ? Math.max(0, padding) : undefined;
  const sides = typeof padding === "object" ? padding : undefined;
  return {
    top: fallback ?? Math.max(0, sides?.top ?? 5),
    right: fallback ?? Math.max(0, sides?.right ?? 5),
    bottom: fallback ?? Math.max(0, sides?.bottom ?? 5),
    left: fallback ?? Math.max(0, sides?.left ?? 5),
  };
}

export function PopoverPositioner(props: PopoverPositionerProps) {
  const context = usePopoverRootContext();
  const keepMounted = usePopoverPortalContext();
  if (keepMounted === null) {
    throw new Error("Rigid UI: <Popover.Positioner> must be used within <Popover.Portal>.");
  }

  const generatedId = createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "");
  const externalAnchorName = `--rigid-popover-external-anchor-${generatedId}`;
  const fallbackName = (index: number) => `--rigid-popover-try-${generatedId}-${index}`;
  const side = () => props.side ?? "bottom";
  const align = () => props.align ?? "center";
  const anchorElement = () => resolveAnchor(props.anchor) ?? context!.activeTrigger()?.element();
  const anchorName = () =>
    props.anchor !== undefined ? externalAnchorName : context!.activeTrigger()?.anchorName;
  const [element, setElement] = createSignal<HTMLDivElement>();
  const [measurementRevision, setMeasurementRevision] = createSignal(0);
  const arrowOffset = () => {
    measurementRevision();
    const anchorRect = anchorElement()?.getBoundingClientRect();
    const positionerRect = element()?.getBoundingClientRect();
    return {
      x: (anchorRect?.left ?? 0) + (anchorRect?.width ?? 0) / 2 - (positionerRect?.left ?? 0),
      y: (anchorRect?.top ?? 0) + (anchorRect?.height ?? 0) / 2 - (positionerRect?.top ?? 0),
    };
  };
  const positionerContext: PopoverPositionerContextValue = {
    side,
    align,
    arrowOffset,
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
    "availableSizePadding",
    "sticky",
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
      if (!anchor || !positioner) return;
      const update = () => setMeasurementRevision((value) => value + 1);
      const observer =
        typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(update);
      observer?.observe(anchor);
      const frame = requestAnimationFrame(update);
      observer?.observe(positioner);
      window.addEventListener("resize", update);
      window.addEventListener("scroll", update, true);
      return () => {
        cancelAnimationFrame(frame);
        observer?.disconnect();
        window.removeEventListener("resize", update);
        window.removeEventListener("scroll", update, true);
      };
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

  function direction(): "ltr" | "rtl" {
    return anchorElement() && getComputedStyle(anchorElement()!).direction === "rtl"
      ? "rtl"
      : "ltr";
  }

  function placementValues(currentSide: PopoverSide, currentAlign: PopoverAlign) {
    const sideOffset = resolveOffset(props.sideOffset);
    const alignOffset = resolveOffset(props.alignOffset);
    const horizontalSide =
      currentSide === "left" || currentSide === "right" || currentSide.startsWith("inline");
    const margins = { top: 0, right: 0, bottom: 0, left: 0 };

    if (currentSide === "bottom") margins.top = sideOffset;
    else if (currentSide === "top") margins.bottom = sideOffset;
    else if (currentSide === "right" || currentSide === "inline-end") margins.left = sideOffset;
    else margins.right = sideOffset;

    if (horizontalSide) {
      if (currentAlign === "start") margins.top += alignOffset;
      else if (currentAlign === "end") margins.bottom += alignOffset;
    } else if (currentAlign === "start") {
      if (direction() === "ltr") margins.left += alignOffset;
      else margins.right += alignOffset;
    } else if (currentAlign === "end") {
      if (direction() === "ltr") margins.right += alignOffset;
      else margins.left += alignOffset;
    }

    const inlineAlignment =
      currentAlign === "center"
        ? "anchor-center"
        : (currentAlign === "start") === (direction() === "ltr")
          ? "start"
          : "end";
    return {
      area: positionArea(currentSide, currentAlign, direction()),
      justifySelf: horizontalSide ? "normal" : inlineAlignment,
      alignSelf: horizontalSide
        ? currentAlign === "center"
          ? "anchor-center"
          : currentAlign
        : "normal",
      marginTop: margins.top,
      marginRight: margins.right,
      marginBottom: margins.bottom,
      marginLeft: margins.left,
      translate:
        currentAlign === "center"
          ? horizontalSide
            ? `0 ${alignOffset}px`
            : `${alignOffset}px 0`
          : "none",
    };
  }

  function fallbackCss() {
    if (typeof CSS === "undefined" || typeof CSS.supports !== "function") return "";
    if (!CSS.supports("position-area: top")) return "";
    return fallbackPlacements(side(), align())
      .map(({ side: fallbackSide, align: fallbackAlign }, index) => {
        const values = placementValues(fallbackSide, fallbackAlign);
        return `@position-try ${fallbackName(index)} {
          position-area: ${values.area};
          justify-self: ${values.justifySelf};
          align-self: ${values.alignSelf};
          margin-top: ${values.marginTop}px;
          margin-right: ${values.marginRight}px;
          margin-bottom: ${values.marginBottom}px;
          margin-left: ${values.marginLeft}px;
          translate: ${values.translate};
        }`;
      })
      .join("\n");
  }

  function positionerStyle(): JSX.CSSProperties | string {
    const currentSide = side();
    const values = placementValues(currentSide, align());
    const padding = availableSizePaddingValue(props.availableSizePadding);
    const positionerRect = element()?.getBoundingClientRect();
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
      "position-area": values.area,
      // CSS exposes no reliable resolved-area API; public state remains the requested placement.
      "position-try-fallbacks": fallbackPlacements(currentSide, align())
        .map((_, index) => fallbackName(index))
        .join(", "),
      "position-visibility": props.sticky ? "always" : "anchors-visible",
      "justify-self": values.justifySelf,
      "align-self": values.alignSelf,
      "margin-top": `${values.marginTop}px`,
      "margin-right": `${values.marginRight}px`,
      "margin-bottom": `${values.marginBottom}px`,
      "margin-left": `${values.marginLeft}px`,
      translate: values.translate,
      "--available-width": `calc(100dvw - ${padding.left + padding.right}px)`,
      "--available-height": `calc(100dvh - ${padding.top + padding.bottom}px)`,
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
        <style>{fallbackCss()}</style>
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
