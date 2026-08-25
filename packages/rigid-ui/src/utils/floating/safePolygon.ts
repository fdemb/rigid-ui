import { Timeout } from "../useTimeout";
import { contains } from "../contains";
import { getTarget } from "../getTarget";

/**
 * Solid port of Base UI's `floating-ui-react/safePolygon`
 * (`reference/base-ui/packages/react/src/floating-ui-react/safePolygon.ts`), minus the nested
 * floating tree: our floating contexts do not yet carry node graphs, so the child-node guards
 * collapse to plain closes.
 */

const CURSOR_SPEED_THRESHOLD = 0.1;
const CURSOR_SPEED_THRESHOLD_SQUARED = CURSOR_SPEED_THRESHOLD * CURSOR_SPEED_THRESHOLD;
const POLYGON_BUFFER = 0.5;

export interface HandleCloseOptions {
  blockPointerEvents?: boolean | undefined;
}

export interface HandleCloseContext {
  x: number | null;
  y: number | null;
  placement: string | null;
  domReferenceElement: Element | null;
  floatingElement: HTMLElement | null;
  onClose: () => void;
}

export interface HandleClose {
  (context: HandleCloseContext): ((event: MouseEvent) => void) | void;
  __options?: HandleCloseOptions | undefined;
}

function hasIntersectingEdge(
  pointX: number,
  pointY: number,
  xi: number,
  yi: number,
  xj: number,
  yj: number,
) {
  return yi >= pointY !== yj >= pointY && pointX <= ((xj - xi) * (pointY - yi)) / (yj - yi) + xi;
}

function isPointInQuadrilateral(
  pointX: number,
  pointY: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  x4: number,
  y4: number,
) {
  let isInsideValue = false;

  if (hasIntersectingEdge(pointX, pointY, x1, y1, x2, y2)) {
    isInsideValue = !isInsideValue;
  }

  if (hasIntersectingEdge(pointX, pointY, x2, y2, x3, y3)) {
    isInsideValue = !isInsideValue;
  }

  if (hasIntersectingEdge(pointX, pointY, x3, y3, x4, y4)) {
    isInsideValue = !isInsideValue;
  }

  if (hasIntersectingEdge(pointX, pointY, x4, y4, x1, y1)) {
    isInsideValue = !isInsideValue;
  }

  return isInsideValue;
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

function isInsideRect(pointX: number, pointY: number, rect: Rect) {
  return (
    pointX >= rect.x &&
    pointX <= rect.x + rect.width &&
    pointY >= rect.y &&
    pointY <= rect.y + rect.height
  );
}

function isInsideAxisAlignedRect(
  pointX: number,
  pointY: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
) {
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);

  return pointX >= minX && pointX <= maxX && pointY >= minY && pointY <= maxY;
}

export interface SafePolygonOptions extends HandleCloseOptions {}

/**
 * Generates a safe polygon area that the user can traverse without closing the floating element
 * once leaving the reference element.
 */
export function safePolygon(options: SafePolygonOptions = {}): HandleClose {
  const { blockPointerEvents = false } = options;
  const timeout = new Timeout();

  function handleClose(context: HandleCloseContext) {
    const { x, y, placement, domReferenceElement, floatingElement, onClose } = context;
    const side = placement?.split("-")[0];
    let hasLanded = false;
    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastCursorTime = typeof performance !== "undefined" ? performance.now() : 0;

    function isCursorMovingSlowly(nextX: number, nextY: number) {
      const currentTime = performance.now();
      const elapsedTime = currentTime - lastCursorTime;

      if (lastX === null || lastY === null || elapsedTime === 0) {
        lastX = nextX;
        lastY = nextY;
        lastCursorTime = currentTime;
        return false;
      }

      const deltaX = nextX - lastX;
      const deltaY = nextY - lastY;
      const distanceSquared = deltaX * deltaX + deltaY * deltaY;
      const thresholdSquared = elapsedTime * elapsedTime * CURSOR_SPEED_THRESHOLD_SQUARED;

      lastX = nextX;
      lastY = nextY;
      lastCursorTime = currentTime;

      return distanceSquared < thresholdSquared;
    }

    function close() {
      timeout.clear();
      onClose();
    }

    function onMouseMove(event: MouseEvent) {
      timeout.clear();

      if (!domReferenceElement || !floatingElement || side == null || x == null || y == null) {
        return undefined;
      }

      const { clientX, clientY } = event;
      const target = getTarget(event) as Element | null;
      const isLeave = event.type === "mouseleave";
      const isOverFloatingEl = contains(floatingElement, target);
      const isOverReferenceEl = contains(domReferenceElement, target);

      if (isOverFloatingEl) {
        hasLanded = true;

        if (!isLeave) {
          return undefined;
        }
      }

      if (isOverReferenceEl) {
        hasLanded = false;

        if (!isLeave) {
          hasLanded = true;
          return undefined;
        }
      }

      const refRect = domReferenceElement.getBoundingClientRect();
      const rect = floatingElement.getBoundingClientRect();
      const cursorLeaveFromRight = x > rect.right - rect.width / 2;
      const cursorLeaveFromBottom = y > rect.bottom - rect.height / 2;
      const isFloatingWider = rect.width > refRect.width;
      const isFloatingTaller = rect.height > refRect.height;
      const left = isFloatingWider ? refRect.left : rect.left;
      const right = isFloatingWider ? refRect.right : rect.right;
      const top = isFloatingTaller ? refRect.top : rect.top;
      const bottom = isFloatingTaller ? refRect.bottom : rect.bottom;

      // If the pointer is leaving from the opposite side, the "buffer" logic creates a point
      // where the floating element remains open, but should be ignored.
      // A constant of 1 handles floating point rounding errors.
      if (
        (side === "top" && y >= refRect.bottom - 1) ||
        (side === "bottom" && y <= refRect.top + 1) ||
        (side === "left" && x >= refRect.right - 1) ||
        (side === "right" && x <= refRect.left + 1)
      ) {
        close();
        return undefined;
      }

      // Ignore when the cursor is within the rectangular trough between the two elements. Since
      // the triangle is created from the cursor point, which can start beyond the reference
      // element's edge, traversing back and forth can otherwise cause a close.
      let isInsideTroughRect = false;

      switch (side) {
        case "top":
          isInsideTroughRect = isInsideAxisAlignedRect(
            clientX,
            clientY,
            left,
            refRect.top + 1,
            right,
            rect.bottom - 1,
          );
          break;
        case "bottom":
          isInsideTroughRect = isInsideAxisAlignedRect(
            clientX,
            clientY,
            left,
            rect.top + 1,
            right,
            refRect.bottom - 1,
          );
          break;
        case "left":
          isInsideTroughRect = isInsideAxisAlignedRect(
            clientX,
            clientY,
            rect.right - 1,
            bottom,
            refRect.left + 1,
            top,
          );
          break;
        case "right":
          isInsideTroughRect = isInsideAxisAlignedRect(
            clientX,
            clientY,
            refRect.right - 1,
            bottom,
            rect.left + 1,
            top,
          );
          break;
        default:
      }

      if (isInsideTroughRect) {
        return undefined;
      }

      if (hasLanded && !isInsideRect(clientX, clientY, refRect)) {
        close();
        return undefined;
      }

      if (!isLeave && isCursorMovingSlowly(clientX, clientY)) {
        close();
        return undefined;
      }

      let isInsidePolygon = false;

      switch (side) {
        case "top": {
          const cursorXOffset = isFloatingWider ? POLYGON_BUFFER / 2 : POLYGON_BUFFER * 4;
          const cursorPointOneX = isFloatingWider
            ? x + cursorXOffset
            : cursorLeaveFromRight
              ? x + cursorXOffset
              : x - cursorXOffset;
          const cursorPointTwoX = isFloatingWider
            ? x - cursorXOffset
            : cursorLeaveFromRight
              ? x + cursorXOffset
              : x - cursorXOffset;
          const cursorPointY = y + POLYGON_BUFFER + 1;

          const commonYLeft = cursorLeaveFromRight
            ? rect.bottom - POLYGON_BUFFER
            : isFloatingWider
              ? rect.bottom - POLYGON_BUFFER
              : rect.top;
          const commonYRight = cursorLeaveFromRight
            ? isFloatingWider
              ? rect.bottom - POLYGON_BUFFER
              : rect.top
            : rect.bottom - POLYGON_BUFFER;

          isInsidePolygon = isPointInQuadrilateral(
            clientX,
            clientY,
            cursorPointOneX,
            cursorPointY,
            cursorPointTwoX,
            cursorPointY,
            rect.left,
            commonYLeft,
            rect.right,
            commonYRight,
          );
          break;
        }
        case "bottom": {
          const cursorXOffset = isFloatingWider ? POLYGON_BUFFER / 2 : POLYGON_BUFFER * 4;
          const cursorPointOneX = isFloatingWider
            ? x + cursorXOffset
            : cursorLeaveFromRight
              ? x + cursorXOffset
              : x - cursorXOffset;
          const cursorPointTwoX = isFloatingWider
            ? x - cursorXOffset
            : cursorLeaveFromRight
              ? x + cursorXOffset
              : x - cursorXOffset;
          const cursorPointY = y - POLYGON_BUFFER;

          const commonYLeft = cursorLeaveFromRight
            ? rect.top + POLYGON_BUFFER
            : isFloatingWider
              ? rect.top + POLYGON_BUFFER
              : rect.bottom;
          const commonYRight = cursorLeaveFromRight
            ? isFloatingWider
              ? rect.top + POLYGON_BUFFER
              : rect.bottom
            : rect.top + POLYGON_BUFFER;

          isInsidePolygon = isPointInQuadrilateral(
            clientX,
            clientY,
            cursorPointOneX,
            cursorPointY,
            cursorPointTwoX,
            cursorPointY,
            rect.left,
            commonYLeft,
            rect.right,
            commonYRight,
          );
          break;
        }
        case "left": {
          const cursorYOffset = isFloatingTaller ? POLYGON_BUFFER / 2 : POLYGON_BUFFER * 4;
          const cursorPointOneY = isFloatingTaller
            ? y + cursorYOffset
            : cursorLeaveFromBottom
              ? y + cursorYOffset
              : y - cursorYOffset;
          const cursorPointTwoY = isFloatingTaller
            ? y - cursorYOffset
            : cursorLeaveFromBottom
              ? y + cursorYOffset
              : y - cursorYOffset;
          const cursorPointX = x + POLYGON_BUFFER + 1;

          const commonXTop = cursorLeaveFromBottom
            ? rect.right - POLYGON_BUFFER
            : isFloatingTaller
              ? rect.right - POLYGON_BUFFER
              : rect.left;
          const commonXBottom = cursorLeaveFromBottom
            ? isFloatingTaller
              ? rect.right - POLYGON_BUFFER
              : rect.left
            : rect.right - POLYGON_BUFFER;

          isInsidePolygon = isPointInQuadrilateral(
            clientX,
            clientY,
            commonXTop,
            rect.top,
            commonXBottom,
            rect.bottom,
            cursorPointX,
            cursorPointOneY,
            cursorPointX,
            cursorPointTwoY,
          );
          break;
        }
        case "right": {
          const cursorYOffset = isFloatingTaller ? POLYGON_BUFFER / 2 : POLYGON_BUFFER * 4;
          const cursorPointOneY = isFloatingTaller
            ? y + cursorYOffset
            : cursorLeaveFromBottom
              ? y + cursorYOffset
              : y - cursorYOffset;
          const cursorPointTwoY = isFloatingTaller
            ? y - cursorYOffset
            : cursorLeaveFromBottom
              ? y + cursorYOffset
              : y - cursorYOffset;
          const cursorPointX = x - POLYGON_BUFFER;

          const commonXTop = cursorLeaveFromBottom
            ? rect.left + POLYGON_BUFFER
            : isFloatingTaller
              ? rect.left + POLYGON_BUFFER
              : rect.right;
          const commonXBottom = cursorLeaveFromBottom
            ? isFloatingTaller
              ? rect.left + POLYGON_BUFFER
              : rect.right
            : rect.left + POLYGON_BUFFER;

          isInsidePolygon = isPointInQuadrilateral(
            clientX,
            clientY,
            cursorPointX,
            cursorPointOneY,
            cursorPointX,
            cursorPointTwoY,
            commonXTop,
            rect.top,
            commonXBottom,
            rect.bottom,
          );
          break;
        }
        default:
      }

      if (!isInsidePolygon) {
        close();
      } else if (!hasLanded) {
        // Give the cursor time to land on the floating element before closing while it is still
        // traversing the polygon away from either element.
        timeout.start(40, close);
      }

      return undefined;
    }

    return onMouseMove;
  }

  const fn = handleClose as unknown as HandleClose;
  fn.__options = { ...options, blockPointerEvents };
  return fn;
}
