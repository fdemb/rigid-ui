import { createEffect, createUniqueId } from "solid-js";
import type { JSX } from "@solidjs/web";
import { renderPart } from "../../internals/renderPart";
import type { PartProps } from "../../utils/domProps";
import type { MeterRootState } from "../root/MeterRoot";
import { useMeterRootContext } from "../root/MeterRootContext";

export interface MeterLabelState extends MeterRootState {}
export interface MeterLabelProps extends PartProps<
  HTMLSpanElement,
  JSX.HTMLAttributes<HTMLSpanElement>,
  MeterLabelState
> {}

export function MeterLabel(props: MeterLabelProps) {
  const context = useMeterRootContext();
  const generatedId = `rigid-meter-label-${createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const id = () => (typeof props.id === "string" ? props.id : generatedId);
  createEffect(id, (current) => context.registerLabel(current));
  return renderPart<HTMLSpanElement, MeterLabelState>("span", props, {
    props: [
      {
        get id() {
          return id();
        },
        role: "presentation",
      },
    ],
    exclude: ["id"],
  });
}

export namespace MeterLabel {
  export type Props = MeterLabelProps;
  export type State = MeterLabelState;
}
