import { createContext, useContext } from "solid-js";

export interface ScrollAreaScrollbarContextValue {
  orientation: "horizontal" | "vertical";
}

export const ScrollAreaScrollbarContext = createContext<ScrollAreaScrollbarContextValue>();

export function useScrollAreaScrollbarContext(): ScrollAreaScrollbarContextValue {
  try {
    return useContext(ScrollAreaScrollbarContext);
  } catch {
    throw new Error(
      "rigid-ui: ScrollAreaScrollbarContext is missing. ScrollAreaScrollbar parts must be placed within <ScrollArea.Scrollbar>.",
    );
  }
}
