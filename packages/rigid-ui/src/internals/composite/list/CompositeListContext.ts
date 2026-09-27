import { createContext, useContext } from "solid-js";
import type { CompositeList } from "./CompositeList";

export type CompositeListContextValue<Metadata = unknown> = Pick<
  CompositeList<Metadata>,
  "register" | "map"
>;

export const CompositeListContext = createContext<CompositeListContextValue<any> | null>(null);

export function useCompositeListContext<Metadata>() {
  return useContext(CompositeListContext) as CompositeListContextValue<Metadata> | null;
}
