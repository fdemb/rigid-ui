import type { JSX } from "@solidjs/web";
import { renderPart } from "../../internals/renderPart";
import { progressStateAttributesMapping } from "../root/stateAttributesMapping";
import type { PartProps } from "../../utils/domProps";
import type { ProgressRootState } from "../root/ProgressRoot";
import { useProgressRootContext } from "../root/ProgressRootContext";

export interface ProgressTrackState extends ProgressRootState {}
export interface ProgressTrackProps extends PartProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  ProgressTrackState
> {}

export function ProgressTrack(props: ProgressTrackProps) {
  const context = useProgressRootContext();
  return renderPart<HTMLDivElement, ProgressTrackState>("div", props, {
    state: context.state,
    stateAttributesMapping: progressStateAttributesMapping,
  });
}

export namespace ProgressTrack {
  export type Props = ProgressTrackProps;
  export type State = ProgressTrackState;
}
