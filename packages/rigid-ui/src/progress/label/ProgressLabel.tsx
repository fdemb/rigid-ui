import { createEffect, createUniqueId } from "solid-js";
import type { JSX } from "@solidjs/web";
import { renderPart } from "../../internals/renderPart";
import { progressStateAttributesMapping } from "../root/stateAttributesMapping";
import type { PartProps } from "../../utils/domProps";
import type { ProgressRootState } from "../root/ProgressRoot";
import { useProgressRootContext } from "../root/ProgressRootContext";

export interface ProgressLabelState extends ProgressRootState {}
export interface ProgressLabelProps extends PartProps<
  HTMLSpanElement,
  JSX.HTMLAttributes<HTMLSpanElement>,
  ProgressLabelState
> {}

export function ProgressLabel(props: ProgressLabelProps) {
  const context = useProgressRootContext();
  const generatedId = `rigid-progress-label-${createUniqueId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const id = () => (typeof props.id === "string" ? props.id : generatedId);
  createEffect(id, (current) => context.registerLabel(current));
  return renderPart<HTMLSpanElement, ProgressLabelState>("span", props, {
    state: context.state,
    stateAttributesMapping: progressStateAttributesMapping,
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

export namespace ProgressLabel {
  export type Props = ProgressLabelProps;
  export type State = ProgressLabelState;
}
