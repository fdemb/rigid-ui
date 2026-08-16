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
  overflowEdgeThreshold: {
    xStart: number;
    xEnd: number;
    yStart: number;
    yEnd: number;
  };

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
}

export const ScrollAreaRootContext = createContext<ScrollAreaRootContextValue>();

export function useScrollAreaRootContext(): ScrollAreaRootContextValue {
  try {
    return useContext(ScrollAreaRootContext);
  } catch {
    throw new Error("rigid-ui: ScrollArea parts must be placed within <ScrollAreaRoot>.");
  }
}
