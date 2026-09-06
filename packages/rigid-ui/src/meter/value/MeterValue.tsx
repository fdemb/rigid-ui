import type { JSX } from "@solidjs/web";
import { renderPart } from "../../internals/renderPart";
import type { PartProps } from "../../utils/domProps";
import type { MeterRootState } from "../root/MeterRoot";
import { useMeterRootContext } from "../root/MeterRootContext";

export interface MeterValueState extends MeterRootState {}
export interface MeterValueProps extends Omit<
  PartProps<HTMLSpanElement, JSX.HTMLAttributes<HTMLSpanElement>, MeterValueState>,
  "children"
> {
  children?: null | ((formattedValue: string, value: number) => JSX.Element);
}

export function MeterValue(props: MeterValueProps) {
  const context = useMeterRootContext();
  return renderPart<HTMLSpanElement, MeterValueState>("span", props, {
    props: [{ "aria-hidden": "true" }],
    children: () =>
      props.children
        ? props.children(context.formattedValue(), context.value())
        : context.formattedValue(),
  });
}

export namespace MeterValue {
  export type Props = MeterValueProps;
  export type State = MeterValueState;
}
