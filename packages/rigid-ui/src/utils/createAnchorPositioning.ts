import { createEffect, createSignal, onCleanup, untrack, type Accessor } from "solid-js";
import type { JSX } from "@solidjs/web";
import {
  arrow as arrowMiddleware,
  autoUpdate,
  computePosition,
  detectOverflow,
  flip,
  limitShift,
  offset,
  shift,
  size,
  type Boundary as FloatingBoundary,
  type Middleware,
  type MiddlewareState,
  type Placement,
  type ReferenceElement,
  type Side as PhysicalSide,
  type Strategy,
} from "@floating-ui/dom";
import { getAlignment, getSide, getSideAxis } from "@floating-ui/utils";
import { createAdaptiveOriginMiddleware, DEFAULT_SIDES, type AdaptiveOriginData } from "./adaptiveOrigin";

const AVAILABLE_WIDTH_VAR = "--available-width";
const AVAILABLE_HEIGHT_VAR = "--available-height";
const ANCHOR_WIDTH_VAR = "--anchor-width";
const ANCHOR_HEIGHT_VAR = "--anchor-height";
const POSITIONER_WIDTH_VAR = "--positioner-width";
const POSITIONER_HEIGHT_VAR = "--positioner-height";
const TRANSFORM_ORIGIN_VAR = "--transform-origin";

export type Side = "top" | "bottom" | "left" | "right" | "inline-start" | "inline-end";
export type { PhysicalSide };
export type Align = "start" | "center" | "end";

export interface AnchorRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * A non-DOM anchor. Anything that can report its viewport rect can be positioned against,
 * which is how popups are anchored to a pointer position or a text selection.
 */
export interface VirtualAnchorElement {
  getBoundingClientRect(): AnchorRect & {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  contextElement?: Element;
}

export type AnchorElement = Element | VirtualAnchorElement;

export type Anchor =
  | AnchorElement
  | null
  | { readonly current: AnchorElement | null }
  | (() => AnchorElement | null);

export type Boundary = "clipping-ancestors" | Element | Element[] | AnchorRect;

export type CollisionPadding =
  | number
  | Partial<{ top: number; right: number; bottom: number; left: number }>;

export interface OffsetData {
  side: Side;
  align: Align;
  anchor: { width: number; height: number };
  positioner: { width: number; height: number };
}

export type OffsetFunction = (data: OffsetData) => number;
export type Offset = number | OffsetFunction;

export interface CollisionAvoidance {
  /**
   * How to avoid collisions on the side axis.
   * - `'flip'`: place the popup on the opposite side when it does not fit.
   * - `'shift'`: keep the side and move the popup within the boundary.
   * - `'none'`: keep the preferred side even if it overflows.
   */
  side?: "flip" | "shift" | "none";
  /**
   * How to avoid collisions on the align axis.
   * - `'flip'`: swap `start` and `end` when the requested alignment overflows.
   * - `'shift'`: keep the alignment and nudge the popup along the align axis to fit.
   * - `'none'`: keep the preferred alignment even if it overflows.
   */
  align?: "flip" | "shift" | "none";
  /**
   * Which logical side to prefer when neither side on the preferred axis fits.
   * `'none'` disables the perpendicular-axis fallback.
   */
  fallbackAxisSide?: "start" | "end" | "none";
}

export const DEFAULT_COLLISION_AVOIDANCE: CollisionAvoidance = {
  side: "flip",
  align: "flip",
  fallbackAxisSide: "end",
};

export interface CreateAnchorPositioningParams {
  anchor: Accessor<Anchor | undefined>;
  positioner: Accessor<HTMLElement | undefined>;
  arrow: Accessor<Element | undefined>;
  mounted: Accessor<boolean>;
  positionMethod: Accessor<"absolute" | "fixed">;
  side: Accessor<Side>;
  sideOffset: Accessor<Offset>;
  align: Accessor<Align>;
  alignOffset: Accessor<Offset>;
  collisionBoundary: Accessor<Boundary>;
  collisionPadding: Accessor<CollisionPadding>;
  collisionAvoidance: Accessor<CollisionAvoidance>;
  sticky: Accessor<boolean>;
  arrowPadding: Accessor<number>;
  disableAnchorTracking: Accessor<boolean>;
  /** Use coordinates directly instead of a translate transform. Required by morphing viewports. */
  useTopLeft: Accessor<boolean>;
}

export interface AnchorPositioning {
  positionerStyles: Accessor<JSX.CSSProperties & Record<string, string | number | undefined>>;
  arrowStyles: Accessor<JSX.CSSProperties>;
  /** The rendered side, expressed with the same vocabulary the `side` prop uses. */
  side: Accessor<Side>;
  align: Accessor<Align>;
  physicalSide: Accessor<PhysicalSide>;
  arrowUncentered: Accessor<boolean>;
  anchorHidden: Accessor<boolean>;
  isPositioned: Accessor<boolean>;
  update(): void;
}

function resolveAnchor(anchor: Anchor | undefined): AnchorElement | null {
  const value = typeof anchor === "function" ? anchor() : anchor;
  if (value && "current" in value) {
    return value.current;
  }
  return value ?? null;
}

function getLogicalSide(sideParam: Side, renderedSide: PhysicalSide, isRtl: boolean): Side {
  const isLogicalSideParam = sideParam === "inline-start" || sideParam === "inline-end";
  const logicalRight = isRtl ? "inline-start" : "inline-end";
  const logicalLeft = isRtl ? "inline-end" : "inline-start";
  return (
    {
      top: "top",
      right: isLogicalSideParam ? logicalRight : "right",
      bottom: "bottom",
      left: isLogicalSideParam ? logicalLeft : "left",
    } satisfies Record<PhysicalSide, Side>
  )[renderedSide];
}

function getPhysicalSide(side: Side, isRtl: boolean): PhysicalSide {
  return (
    {
      top: "top",
      right: "right",
      bottom: "bottom",
      left: "left",
      "inline-end": isRtl ? "left" : "right",
      "inline-start": isRtl ? "right" : "left",
    } satisfies Record<Side, PhysicalSide>
  )[side];
}

function expandPadding(padding: CollisionPadding) {
  if (typeof padding === "number") {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  return {
    top: padding.top || 0,
    right: padding.right || 0,
    bottom: padding.bottom || 0,
    left: padding.left || 0,
  };
}

function getOffsetData(state: MiddlewareState, sideParam: Side, isRtl: boolean): OffsetData {
  const { rects, placement } = state;
  return {
    side: getLogicalSide(sideParam, getSide(placement), isRtl),
    align: getAlignment(placement) ?? "center",
    anchor: { width: rects.reference.width, height: rects.reference.height },
    positioner: { width: rects.floating.width, height: rects.floating.height },
  };
}

function resolveOffset(value: Offset, data: OffsetData) {
  return typeof value === "function" ? value(data) : value;
}

function readDirection(anchor: AnchorElement | null, positioner: HTMLElement | undefined) {
  const element =
    anchor instanceof Element ? anchor : (anchor?.contextElement ?? positioner) || null;
  if (!element || typeof getComputedStyle === "undefined") {
    return "ltr";
  }
  return getComputedStyle(element).direction === "rtl" ? "rtl" : "ltr";
}

/**
 * Mirrors Floating UI's `hide()` but additionally treats a zero-area anchor at the origin as
 * hidden, which is how a detached or unmounted anchor reports itself.
 */
const hideMiddleware: Middleware = {
  name: "hide",
  async fn(state) {
    const { width, height, x, y } = state.rects.reference;
    const detached = width === 0 && height === 0 && x === 0 && y === 0;
    const overflow = await detectOverflow(state, { elementContext: "reference" });
    const referenceHidden =
      overflow.top - height >= 0 ||
      overflow.right - width >= 0 ||
      overflow.bottom - height >= 0 ||
      overflow.left - width >= 0;

    return { data: { referenceHidden: referenceHidden || detached } };
  },
};

/**
 * Positions a floating element against an anchor, tracking the anchor for as long as both are
 * mounted. Wraps Floating UI's `computePosition`/`autoUpdate`.
 */
export function createAnchorPositioning(params: CreateAnchorPositioningParams): AnchorPositioning {
  const [coords, setCoords] = createSignal({ x: 0, y: 0 });
  const [renderedPlacement, setRenderedPlacement] = createSignal<Placement>("bottom");
  const [arrowCoords, setArrowCoords] = createSignal<{ x?: number; y?: number }>({});
  const [arrowUncentered, setArrowUncentered] = createSignal(false);
  const [anchorHidden, setAnchorHidden] = createSignal(false);
  const [isPositioned, setIsPositioned] = createSignal(false);
  const [isRtl, setIsRtl] = createSignal(false);
  // Which edge the coordinates below are relative to. Flips from left/top to right/bottom while
  // the positioner has a size transition running, so a growing popup expands away from the
  // trigger instead of across it. See `useTopLeft` and `adaptiveOrigin.ts`.
  const [sides, setSides] = createSignal<AdaptiveOriginData>(DEFAULT_SIDES);
  // Seeded so consumer rules like `max-height: var(--available-height)` resolve to a valid length
  // on the first pass. An unresolved `var()` invalidates the whole declaration, which would let
  // the popup be measured unconstrained while `flip()` picks its side.
  const [sizeVars, setSizeVars] = createSignal({
    availableWidth: "100vw",
    availableHeight: "100vh",
    anchorWidth: "0px",
    anchorHeight: "0px",
    positionerWidth: "0px",
    positionerHeight: "0px",
    transformOrigin: "50% 50%",
  });

  // `arrow()` requires an element even when the consumer renders no arrow; transform-origin math
  // reads its dimensions too. A detached node keeps both paths branch-free.
  let fallbackArrow: Element | undefined;
  let requestId = 0;

  const physicalSide = () => getSide(renderedPlacement());
  const side = () => getLogicalSide(params.side(), physicalSide(), isRtl());
  const align = (): Align => getAlignment(renderedPlacement()) ?? "center";

  function buildMiddleware(sideParam: Side, rtl: boolean, arrowElement: Element) {
    const avoidance = params.collisionAvoidance();
    const avoidSide = avoidance.side ?? "flip";
    const avoidAlign = avoidance.align ?? "flip";
    const fallbackAxisSide = avoidance.fallbackAxisSide ?? "end";
    const alignParam = params.align();
    const sticky = params.sticky();
    const collisionPadding = expandPadding(params.collisionPadding());
    const boundary = params.collisionBoundary();
    const arrowPadding = params.arrowPadding();

    const commonCollisionProps = {
      boundary: (boundary === "clipping-ancestors"
        ? "clippingAncestors"
        : boundary) as FloatingBoundary,
      padding: collisionPadding,
    };

    // Bias the preferred side so a popup that exactly fits does not flip. On iOS the software
    // keyboard centers the input in the viewport, which otherwise flips the popup to the top.
    // Applied to `flip()` only, so it never shifts the resting position that `shift()` and
    // `size()` compute from the requested `collisionPadding`.
    const bias = 1;
    const flipPadding = {
      top: collisionPadding.top + bias + (sideParam === "bottom" ? bias : 0),
      right: collisionPadding.right + bias + (sideParam === "left" ? bias : 0),
      bottom: collisionPadding.bottom + bias + (sideParam === "top" ? bias : 0),
      left: collisionPadding.left + bias + (sideParam === "right" ? bias : 0),
    };

    const middleware: (Middleware | null)[] = [
      offset((state) => {
        const data = getOffsetData(state, sideParam, rtl);
        const alignAxis = resolveOffset(params.alignOffset(), data);
        return {
          mainAxis: resolveOffset(params.sideOffset(), data),
          crossAxis: alignAxis,
          alignmentAxis: alignAxis,
        };
      }),
    ];

    const shiftDisabled = avoidAlign === "none" && avoidSide !== "shift";
    const crossAxisShiftEnabled = !shiftDisabled && (sticky || avoidSide === "shift");

    const flipMiddleware =
      avoidSide === "none"
        ? null
        : flip({
            ...commonCollisionProps,
            // `size()` uses the smaller padding, so `flip()` takes precedence and the popup still
            // flips once it has been capped by `--available-height` and then resizes.
            padding: flipPadding,
            mainAxis: avoidSide === "flip",
            crossAxis: avoidAlign === "flip" ? "alignment" : false,
            fallbackAxisSideDirection: fallbackAxisSide,
          });

    const shiftMiddleware = shiftDisabled
      ? null
      : shift({
          ...commonCollisionProps,
          mainAxis: avoidAlign !== "none",
          crossAxis: crossAxisShiftEnabled,
          limiter: sticky
            ? undefined
            : limitShift((limitData) => {
                const { width, height } = arrowElement.getBoundingClientRect();
                const sideAxis = getSideAxis(getSide(limitData.placement));
                const arrowSize = sideAxis === "y" ? width : height;
                const padding =
                  sideAxis === "y"
                    ? collisionPadding.left + collisionPadding.right
                    : collisionPadding.top + collisionPadding.bottom;
                return { offset: arrowSize / 2 + padding / 2 };
              }),
        });

    // https://floating-ui.com/docs/flip#combining-with-shift
    if (avoidSide === "shift" || avoidAlign === "shift" || alignParam === "center") {
      middleware.push(shiftMiddleware, flipMiddleware);
    } else {
      middleware.push(flipMiddleware, shiftMiddleware);
    }

    middleware.push(
      size({
        ...commonCollisionProps,
        apply({ elements, availableWidth, availableHeight, rects }) {
          // Snap to device pixels so a popup sized from `--anchor-width` visually matches the
          // anchor instead of landing a subpixel short.
          const dpr = elements.floating.ownerDocument.defaultView?.devicePixelRatio || 1;
          const { x, y, width, height } = rects.reference;
          const anchorWidth = (Math.round((x + width) * dpr) - Math.round(x * dpr)) / dpr;
          const anchorHeight = (Math.round((y + height) * dpr) - Math.round(y * dpr)) / dpr;

          const next = {
            availableWidth: `${availableWidth}px`,
            availableHeight: `${availableHeight}px`,
            anchorWidth: `${anchorWidth}px`,
            anchorHeight: `${anchorHeight}px`,
            positionerWidth: `${rects.floating.width}px`,
            positionerHeight: `${rects.floating.height}px`,
          };

          // Written imperatively as well as through the reactive style so that middleware running
          // later in this same pass measures the popup with its size cap already applied.
          const style = elements.floating.style;
          style.setProperty(AVAILABLE_WIDTH_VAR, next.availableWidth);
          style.setProperty(AVAILABLE_HEIGHT_VAR, next.availableHeight);
          style.setProperty(ANCHOR_WIDTH_VAR, next.anchorWidth);
          style.setProperty(ANCHOR_HEIGHT_VAR, next.anchorHeight);
          // A morphing viewport owns these two vars imperatively (`createPopupAutoResize`), driving
          // them from the popup's measured content size rather than the floating rect. Writing them
          // here too would fight that: this callback also reruns on every scroll/resize tick.
          if (!params.useTopLeft()) {
            style.setProperty(POSITIONER_WIDTH_VAR, next.positionerWidth);
            style.setProperty(POSITIONER_HEIGHT_VAR, next.positionerHeight);
          }

          setSizeVars((current) => ({ ...current, ...next }));
        },
      }),
      arrowMiddleware({ element: arrowElement, padding: arrowPadding }),
      {
        name: "transformOrigin",
        fn(state) {
          const { middlewareData, placement, rects, y } = state;
          const currentSide = getSide(placement);
          const arrowX = middlewareData.arrow?.x ?? 0;
          const arrowY = middlewareData.arrow?.y ?? 0;
          const transformX = arrowX + arrowElement.clientWidth / 2;
          const transformY = arrowY + arrowElement.clientHeight / 2;
          const sideOffsetValue = resolveOffset(
            params.sideOffset(),
            getOffsetData(state, sideParam, rtl),
          );
          const shiftY = Math.abs(middlewareData.shift?.y ?? 0);
          const isOverlappingAnchor = shiftY > sideOffsetValue;

          const adjacent = {
            top: `${transformX}px calc(100% + ${sideOffsetValue}px)`,
            bottom: `${transformX}px ${-sideOffsetValue}px`,
            left: `calc(100% + ${sideOffsetValue}px) ${transformY}px`,
            right: `${-sideOffsetValue}px ${transformY}px`,
          }[currentSide];
          const overlap = `${transformX}px ${rects.reference.y + rects.reference.height / 2 - y}px`;
          const transformOrigin =
            crossAxisShiftEnabled && getSideAxis(currentSide) === "y" && isOverlappingAnchor
              ? overlap
              : adjacent;

          state.elements.floating.style.setProperty(TRANSFORM_ORIGIN_VAR, transformOrigin);
          setSizeVars((current) => ({ ...current, transformOrigin }));

          return {};
        },
      },
      hideMiddleware,
      // Only meaningful in coordinate mode: a transform can't be kept while its target properties
      // change, so `useTopLeft` callers (morphing viewports) are the ones that need the anchored
      // edge preserved as the popup resizes.
      params.useTopLeft() ? createAdaptiveOriginMiddleware() : null,
    );

    return middleware.filter((entry): entry is Middleware => entry !== null);
  }

  function update() {
    untrack(() => {
      const floating = params.positioner();
      const anchor = resolveAnchor(params.anchor());
      if (!floating || !anchor || !params.mounted()) {
        return;
      }

      if (!fallbackArrow) {
        fallbackArrow = floating.ownerDocument.createElement("div");
      }
      const arrowElement = params.arrow() ?? fallbackArrow;
      const sideParam = params.side();
      const rtl = readDirection(anchor, floating) === "rtl";
      const alignParam = params.align();
      const physical = getPhysicalSide(sideParam, rtl);
      const placement = (
        alignParam === "center" ? physical : `${physical}-${alignParam}`
      ) as Placement;

      const id = ++requestId;
      void computePosition(anchor as ReferenceElement, floating, {
        placement,
        strategy: params.positionMethod() as Strategy,
        middleware: buildMiddleware(sideParam, rtl, arrowElement),
      }).then((result) => {
        // A newer pass (or an unmount) started while this one was in flight.
        if (id !== requestId) {
          return;
        }
        setIsRtl(rtl);
        setCoords({ x: result.x, y: result.y });
        setSides((result.middlewareData.adaptiveOrigin as AdaptiveOriginData | undefined) ?? DEFAULT_SIDES);
        setRenderedPlacement(result.placement);
        setArrowCoords({ x: result.middlewareData.arrow?.x, y: result.middlewareData.arrow?.y });
        setArrowUncentered((result.middlewareData.arrow?.centerOffset ?? 0) !== 0);
        setAnchorHidden(Boolean(result.middlewareData.hide?.referenceHidden));
        setIsPositioned(true);
      });
    });
  }

  createEffect(
    () =>
      [
        resolveAnchor(params.anchor()),
        params.positioner(),
        params.mounted(),
        params.disableAnchorTracking(),
      ] as const,
    ([anchor, floating, mounted, noTracking]) => {
      if (!anchor || !floating || !mounted) {
        requestId += 1;
        setIsPositioned(false);
        return;
      }

      return autoUpdate(anchor as ReferenceElement, floating, update, {
        ancestorScroll: !noTracking,
        elementResize: !noTracking && typeof ResizeObserver !== "undefined",
        layoutShift: !noTracking && typeof IntersectionObserver !== "undefined",
      });
    },
  );

  // Reposition when a positioning option changes. Function-valued offsets are read at
  // computation time, so only their identity is tracked here.
  createEffect(
    () =>
      [
        params.side(),
        params.align(),
        params.sideOffset(),
        params.alignOffset(),
        params.positionMethod(),
        params.collisionBoundary(),
        params.collisionPadding(),
        params.collisionAvoidance(),
        params.sticky(),
        params.arrowPadding(),
        params.arrow(),
        params.useTopLeft(),
      ] as const,
    () => update(),
  );

  onCleanup(() => {
    requestId += 1;
  });

  const positionerStyles = () => {
    const vars = sizeVars();
    const positioned = isPositioned();
    const { x, y } = coords();
    const useCoords = positioned && params.useTopLeft();
    const { sideX, sideY } = sides();
    // Default to `fixed` before the first pass so an autofocused popup cannot scroll the page
    // from a stale offset while it is still laid out at the origin.
    const position = positioned ? params.positionMethod() : "fixed";

    return {
      position,
      top: useCoords ? (sideY === "top" ? `${Math.round(y)}px` : undefined) : "0",
      left: useCoords ? (sideX === "left" ? `${Math.round(x)}px` : undefined) : "0",
      right: useCoords && sideX === "right" ? `${Math.round(x)}px` : undefined,
      bottom: useCoords && sideY === "bottom" ? `${Math.round(y)}px` : undefined,
      // Ignore coordinates retained from a previous open until this open has been measured.
      // Rendering a full-size popup at a stale offset can overflow the layout viewport, which
      // makes mobile browsers zoom out and reflow everything the popup is anchored to.
      transform:
        positioned && !params.useTopLeft()
          ? `translate(${Math.round(x)}px, ${Math.round(y)}px)`
          : undefined,
      opacity: positioned ? undefined : 0,
      [AVAILABLE_WIDTH_VAR]: vars.availableWidth,
      [AVAILABLE_HEIGHT_VAR]: vars.availableHeight,
      [ANCHOR_WIDTH_VAR]: vars.anchorWidth,
      [ANCHOR_HEIGHT_VAR]: vars.anchorHeight,
      // A morphing viewport drives these two imperatively; see the matching guard in `size()`.
      [POSITIONER_WIDTH_VAR]: params.useTopLeft() ? undefined : vars.positionerWidth,
      [POSITIONER_HEIGHT_VAR]: params.useTopLeft() ? undefined : vars.positionerHeight,
      [TRANSFORM_ORIGIN_VAR]: vars.transformOrigin,
    } satisfies JSX.CSSProperties & Record<string, string | number | undefined>;
  };

  const arrowStyles = (): JSX.CSSProperties => {
    const { x, y } = arrowCoords();
    return {
      position: "absolute",
      left: x === undefined ? undefined : `${x}px`,
      top: y === undefined ? undefined : `${y}px`,
    };
  };

  return {
    positionerStyles,
    arrowStyles,
    side,
    align,
    physicalSide,
    arrowUncentered,
    anchorHidden,
    isPositioned,
    update,
  };
}
