import { createContext, useContext } from "solid-js";

export interface ScrollAreaViewportContextValue {
  computeThumbPosition: () => void;
}

export const ScrollAreaViewportContext = createContext<ScrollAreaViewportContextValue>();

export function useScrollAreaViewportContext(): ScrollAreaViewportContextValue {
  try {
    return useContext(ScrollAreaViewportContext);
  } catch {
    throw new Error(
      "rigid-ui: ScrollAreaViewportContext missing. ScrollAreaViewport parts must be placed within <ScrollArea.Viewport>.",
    );
  }
}
