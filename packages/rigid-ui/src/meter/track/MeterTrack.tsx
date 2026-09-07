import type { JSX } from "@solidjs/web";
import { renderPart } from "../../internals/renderPart";
import type { PartProps } from "../../utils/domProps";
import type { MeterRootState } from "../root/MeterRoot";

export interface MeterTrackState extends MeterRootState {}
export interface MeterTrackProps extends PartProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  MeterTrackState
> {}

export function MeterTrack(props: MeterTrackProps) {
  return renderPart<HTMLDivElement, MeterTrackState>("div", props);
}

export namespace MeterTrack {
  export type Props = MeterTrackProps;
  export type State = MeterTrackState;
}
