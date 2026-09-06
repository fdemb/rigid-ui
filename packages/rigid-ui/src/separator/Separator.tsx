import type { JSX } from "@solidjs/web";
import { renderPart } from "../internals/renderPart";
import type { PartProps } from "../utils/domProps";

export interface SeparatorState {
  orientation: "horizontal" | "vertical";
}

export interface SeparatorProps extends PartProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  SeparatorState
> {
  /** The orientation of the separator. Defaults to horizontal. */
  orientation?: SeparatorState["orientation"];
}

export function Separator(props: SeparatorProps) {
  const state = (): SeparatorState => ({ orientation: props.orientation ?? "horizontal" });

  return renderPart<HTMLDivElement, SeparatorState>("div", props, {
    state,
    props: [
      {
        role: "separator",
        get "aria-orientation"() {
          return state().orientation;
        },
      },
    ],
    exclude: ["orientation"],
  });
}

export namespace Separator {
  export type Props = SeparatorProps;
  export type State = SeparatorState;
}
