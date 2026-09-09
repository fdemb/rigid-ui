import { createContext, useContext, type Accessor } from "solid-js";

import type { ProgressRootState } from "./ProgressRoot";

export interface ProgressRootContextValue {
  state: Accessor<ProgressRootState>;
  formattedValue: Accessor<string>;
  percentageValue: Accessor<number | null>;
  value: Accessor<number | null>;
  registerLabel(id: string): () => void;
}

export const ProgressRootContext = createContext<ProgressRootContextValue | null>(null);

export function useProgressRootContext() {
  const context = useContext(ProgressRootContext);
  if (!context) {
    throw new Error(
      "Rigid UI: ProgressRootContext is missing. Progress parts must be placed within <Progress.Root>.",
    );
  }
  return context;
}
