import { describe, expect, it } from "vite-plus/test";
import {
  CommonPopupDataAttributes,
  CommonTriggerDataAttributes,
  popupStateMapping,
  popupTransitionStateMapping,
  pressableTriggerOpenStateMapping,
  triggerOpenStateMapping,
} from "./popupStateMapping";

/**
 * Contract pins for the shared popup `data-*` vocabulary. Base UI asserts these through
 * component-level enumSync tests; the mappings themselves are pinned here so a rename breaks
 * loudly at the vocabulary layer.
 */
describe("popupStateMapping", () => {
  it("renders data-open while open and data-closed while closed", () => {
    expect(popupStateMapping.open(true)).toEqual({ "data-open": "" });
    expect(popupStateMapping.open(false)).toEqual({ "data-closed": "" });
  });

  it("marks anchor-hidden only when true", () => {
    expect(popupStateMapping.anchorHidden(true)).toEqual({ "data-anchor-hidden": "" });
    expect(popupStateMapping.anchorHidden(false)).toBeNull();
  });

  it("composes transition attributes into the popup transition mapping", () => {
    expect(popupTransitionStateMapping.transitionStatus?.("starting")).toEqual({
      [CommonPopupDataAttributes.startingStyle]: "",
    });
    expect(popupTransitionStateMapping.transitionStatus?.("ending")).toEqual({
      [CommonPopupDataAttributes.endingStyle]: "",
    });
    expect(popupTransitionStateMapping.open(true)).toEqual({
      [CommonPopupDataAttributes.open]: "",
    });
  });

  it("maps triggers to data-popup-open, with pressed added for pressable triggers", () => {
    expect(triggerOpenStateMapping.open(true)).toEqual({
      [CommonTriggerDataAttributes.popupOpen]: "",
    });
    expect(triggerOpenStateMapping.open(false)).toBeNull();
    expect(pressableTriggerOpenStateMapping.open(true)).toEqual({
      [CommonTriggerDataAttributes.popupOpen]: "",
      [CommonTriggerDataAttributes.pressed]: "",
    });
  });
});
