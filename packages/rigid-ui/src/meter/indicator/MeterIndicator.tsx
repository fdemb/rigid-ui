import type { JSX } from "@solidjs/web";
import { renderPart } from "../../internals/renderPart";
import type { PartProps } from "../../utils/domProps";
import type { MeterRootState } from "../root/MeterRoot";
import { useMeterRootContext } from "../root/MeterRootContext";

export interface MeterIndicatorState extends MeterRootState {}
export interface MeterIndicatorProps extends PartProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  MeterIndicatorState
> {}

export function MeterIndicator(props: MeterIndicatorProps) {
  const context = useMeterRootContext();
  return renderPart<HTMLDivElement, MeterIndicatorState>("div", props, {
    props: [
      {
        get style() {
          return {
            "inset-inline-start": 0,
            height: "inherit",
            width: `${context.percentageValue()}%`,
          };
        },
      },
    ],
  });
}

export namespace MeterIndicator {
  export type Props = MeterIndicatorProps;
  export type State = MeterIndicatorState;
}
