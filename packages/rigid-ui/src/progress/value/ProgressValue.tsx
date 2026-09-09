import type { JSX } from "@solidjs/web";
import { renderPart } from "../../internals/renderPart";
import { progressStateAttributesMapping } from "../root/stateAttributesMapping";
import type { PartProps } from "../../utils/domProps";
import type { ProgressRootState } from "../root/ProgressRoot";
import { useProgressRootContext } from "../root/ProgressRootContext";

export interface ProgressValueState extends ProgressRootState {}
export interface ProgressValueProps extends Omit<
  PartProps<HTMLSpanElement, JSX.HTMLAttributes<HTMLSpanElement>, ProgressValueState>,
  "children"
> {
  children?: null | ((formattedValue: string | null, value: number | null) => JSX.Element);
}

export function ProgressValue(props: ProgressValueProps) {
  const context = useProgressRootContext();
  return renderPart<HTMLSpanElement, ProgressValueState>("span", props, {
    state: context.state,
    stateAttributesMapping: progressStateAttributesMapping,
    props: [{ "aria-hidden": "true" }],
    children: () =>
      props.children
        ? props.children(
            context.state().status === "indeterminate" ? "indeterminate" : context.formattedValue(),
            context.value(),
          )
        : context.formattedValue(),
  });
}

export namespace ProgressValue {
  export type Props = ProgressValueProps;
  export type State = ProgressValueState;
}
