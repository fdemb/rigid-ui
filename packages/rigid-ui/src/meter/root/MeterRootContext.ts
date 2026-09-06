import { createContext, useContext, type Accessor } from "solid-js";

export interface MeterRootContextValue {
  formattedValue: Accessor<string>;
  percentageValue: Accessor<number>;
  value: Accessor<number>;
  registerLabel(id: string): () => void;
}

export const MeterRootContext = createContext<MeterRootContextValue | null>(null);

export function useMeterRootContext() {
  const context = useContext(MeterRootContext);
  if (!context) {
    throw new Error(
      "Rigid UI: MeterRootContext is missing. Meter parts must be placed within <Meter.Root>.",
    );
  }
  return context;
}
