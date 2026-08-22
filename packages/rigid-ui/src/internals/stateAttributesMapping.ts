import type { StateAttributesMapping } from "./getStateAttributesProps";
import type { TransitionStatus } from "./createTransitionStatus";

/**
 * Solid port of Base UI's
 * `reference/base-ui/packages/react/src/internals/stateAttributesMapping.ts`.
 */
export enum TransitionStatusDataAttributes {
  /**
   * Present when the component begins animating in.
   */
  startingStyle = "data-starting-style",
  /**
   * Present when the component is animating out.
   */
  endingStyle = "data-ending-style",
}

const STARTING_HOOK = { "data-starting-style": "" };
const ENDING_HOOK = { "data-ending-style": "" };

export const transitionStatusMapping = {
  transitionStatus(value: TransitionStatus): Record<string, string> | null {
    if (value === "starting") {
      return STARTING_HOOK;
    }
    if (value === "ending") {
      return ENDING_HOOK;
    }
    return null;
  },
} satisfies StateAttributesMapping<{ transitionStatus: TransitionStatus }>;
