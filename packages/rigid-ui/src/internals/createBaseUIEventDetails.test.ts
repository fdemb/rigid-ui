import { describe, expect, it } from "vite-plus/test";
import { REASONS } from "./reasons";
import { createChangeEventDetails, createGenericEventDetails } from "./createBaseUIEventDetails";

/**
 * Contracts of Base UI's
 * `reference/base-ui/packages/react/src/internals/createBaseUIEventDetails.ts`, exercised through
 * Dialog/Popover behavior there (`onOpenChange` cancel() preventing the state change etc.) and
 * pinned here directly so every component root shares them.
 */
describe("createChangeEventDetails", () => {
  it("exposes the reason, event, and trigger", () => {
    const trigger = document.createElement("button");
    const details = createChangeEventDetails(
      REASONS.triggerPress,
      new MouseEvent("click"),
      trigger,
    );

    expect(details.reason).toBe("trigger-press");
    expect(details.event).toBeInstanceOf(Event);
    expect(details.trigger).toBe(trigger);
  });

  it("defaults the event to a synthetic base-ui Event and the trigger to undefined", () => {
    const details = createChangeEventDetails(REASONS.imperativeAction);

    expect(details.event.type).toBe("base-ui");
    expect(details.trigger).toBeUndefined();
  });

  it("starts neither canceled nor propagation-allowed", () => {
    const details = createChangeEventDetails(REASONS.escapeKey);

    expect(details.isCanceled).toBe(false);
    expect(details.isPropagationAllowed).toBe(false);
  });

  it("records cancel()", () => {
    const details = createChangeEventDetails(REASONS.outsidePress);

    expect(details.isCanceled).toBe(false);
    details.cancel();
    expect(details.isCanceled).toBe(true);
  });

  it("records allowPropagation()", () => {
    const details = createChangeEventDetails(REASONS.outsidePress);

    details.allowPropagation();
    expect(details.isPropagationAllowed).toBe(true);
  });

  it("merges custom properties into the details object", () => {
    const details = createChangeEventDetails(
      REASONS.triggerPress,
      new MouseEvent("click"),
      undefined,
      {
        preventUnmountOnClose() {
          /* component-specific extension */
        },
      },
    );

    expect(typeof details.preventUnmountOnClose).toBe("function");
  });
});

describe("createGenericEventDetails", () => {
  it("carries reason and event without cancel semantics", () => {
    const details = createGenericEventDetails(REASONS.keyboard, new KeyboardEvent("keydown"));

    expect(details.reason).toBe("keyboard");
    expect(details.event).toBeInstanceOf(KeyboardEvent);
    expect("cancel" in details).toBe(false);
    expect("isCanceled" in details).toBe(false);
  });

  it("merges custom properties", () => {
    const details = createGenericEventDetails(REASONS.none, undefined, { index: 3 });

    expect(details.index).toBe(3);
  });
});
