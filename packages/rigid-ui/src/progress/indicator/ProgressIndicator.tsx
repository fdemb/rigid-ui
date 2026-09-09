import type { JSX } from "@solidjs/web";
import { renderPart } from "../../internals/renderPart";
import { progressStateAttributesMapping } from "../root/stateAttributesMapping";
import type { PartProps } from "../../utils/domProps";
import type { ProgressRootState } from "../root/ProgressRoot";
import { useProgressRootContext } from "../root/ProgressRootContext";

export interface ProgressIndicatorState extends ProgressRootState {}
export interface ProgressIndicatorProps extends PartProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  ProgressIndicatorState
> {}

export function ProgressIndicator(props: ProgressIndicatorProps) {
  const context = useProgressRootContext();
  return renderPart<HTMLDivElement, ProgressIndicatorState>("div", props, {
    state: context.state,
    stateAttributesMapping: progressStateAttributesMapping,
    props: [
      {
        get style() {
          const percentage = context.percentageValue();
          return percentage === null
            ? {}
            : {
                "inset-inline-start": 0,
                height: "inherit",
                width: `${percentage}%`,
              };
        },
      },
    ],
  });
}

export namespace ProgressIndicator {
  export type Props = ProgressIndicatorProps;
  export type State = ProgressIndicatorState;
}
