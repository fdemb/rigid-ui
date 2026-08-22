import { createContext, useContext } from "solid-js";

export interface ScrollAreaViewportContextValue {
  computeThumbPosition: () => void;
}

export const ScrollAreaViewportContext = createContext<ScrollAreaViewportContextValue>();

export function useScrollAreaViewportContext(): ScrollAreaViewportContextValue {
  try {
    return useContext(ScrollAreaViewportContext);
  } catch {
    throw new Error("Rigid UI: <ScrollArea.Content> must be used within <ScrollArea.Viewport>.");
  }
}
