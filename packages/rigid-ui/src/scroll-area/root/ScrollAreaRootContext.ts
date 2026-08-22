import { createContext, useContext } from "solid-js";
import type { Accessor, Setter } from "solid-js";

export interface Coords {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface HiddenState {
  x: boolean;
  y: boolean;
  corner: boolean;
}

export interface OverflowEdges {
  xStart: boolean;
  xEnd: boolean;
  yStart: boolean;
  yEnd: boolean;
}

export interface ScrollAreaRootContextValue {
  /**
   * Stable per-instance id, stamped as `data-id="{rootId}-viewport"` on the viewport and
   * `data-id="{rootId}-scrollbar"` on the scrollbars so sibling scroll areas can be told apart
   * from outside.
   */
  rootId: string;
  cornerSize: Accessor<Size>;
  setCornerSize: Setter<Size>;
  thumbSize: Accessor<Size>;
  setThumbSize: Setter<Size>;
  hovering: Accessor<boolean>;
  setHovering: Setter<boolean>;
  scrollingX: Accessor<boolean>;
  setScrollingX: Setter<boolean>;
  scrollingY: Accessor<boolean>;
  setScrollingY: Setter<boolean>;
  hiddenState: Accessor<HiddenState>;
  setHiddenState: Setter<HiddenState>;
  overflowEdges: Accessor<OverflowEdges>;
  setOverflowEdges: Setter<OverflowEdges>;
  overflowEdgeThreshold: Accessor<{
    xStart: number;
    xEnd: number;
    yStart: number;
    yEnd: number;
  }>;
  /**
   * Whether the viewport has been measured at least once. Until then the scrollbar parts stay
   * `visibility: hidden`, so a track never paints at an unmeasured thumb size.
   */
  hasMeasuredScrollbar: Accessor<boolean>;
  setHasMeasuredScrollbar: Setter<boolean>;
  /**
   * Whether the last pointer interaction came from touch. Deliberately not a signal: it is only
   * read from event handlers, one of which can run in the same tick as the write.
   */
  readonly touchModality: boolean;

  // Mutable DOM refs — no signals needed, Solid doesn't re-render
  viewportRef: HTMLDivElement | undefined;
  scrollbarYRef: HTMLDivElement | undefined;
  scrollbarXRef: HTMLDivElement | undefined;
  thumbYRef: HTMLDivElement | undefined;
  thumbXRef: HTMLDivElement | undefined;
  cornerRef: HTMLDivElement | undefined;

  handlePointerDown: (event: PointerEvent) => void;
  handlePointerMove: (event: PointerEvent) => void;
  handlePointerUp: (event: PointerEvent) => void;
  handleScroll: (scrollPosition: Coords) => void;
  disableViewportSnap: () => void;
}

export const ScrollAreaRootContext = createContext<ScrollAreaRootContextValue>();

export function useScrollAreaRootContext(): ScrollAreaRootContextValue {
  try {
    return useContext(ScrollAreaRootContext);
  } catch {
    throw new Error("Rigid UI: ScrollArea parts must be used within <ScrollArea.Root>.");
  }
}
