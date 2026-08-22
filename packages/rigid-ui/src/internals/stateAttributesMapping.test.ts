import { describe, expect, it } from "vite-plus/test";
import { TransitionStatusDataAttributes, transitionStatusMapping } from "./stateAttributesMapping";
import { getStateAttributesProps } from "./getStateAttributesProps";

/** Port of `reference/base-ui/packages/react/src/internals/stateAttributesMapping.test.ts`. */
describe("transitionStatusMapping", () => {
  it("names the transition data-attributes per TransitionStatusDataAttributes", () => {
    const starting = getStateAttributesProps(
      { transitionStatus: "starting" as const },
      transitionStatusMapping,
    );
    const ending = getStateAttributesProps(
      { transitionStatus: "ending" as const },
      transitionStatusMapping,
    );
    const idle = getStateAttributesProps(
      { transitionStatus: "idle" as const },
      transitionStatusMapping,
    );
    const none = getStateAttributesProps({ transitionStatus: undefined }, transitionStatusMapping);

    expect(starting).toEqual({ [TransitionStatusDataAttributes.startingStyle]: "" });
    expect(ending).toEqual({ [TransitionStatusDataAttributes.endingStyle]: "" });
    expect(idle).toEqual({});
    expect(none).toEqual({});
  });
});
