import { describe, expect, it } from "vite-plus/test";
import { AccordionHeaderDataAttributes } from "./header/AccordionHeaderDataAttributes";
import { AccordionItemDataAttributes } from "./item/AccordionItemDataAttributes";
import { accordionStateAttributesMapping } from "./item/stateAttributesMapping";
import { AccordionPanelDataAttributes } from "./panel/AccordionPanelDataAttributes";
import { AccordionRootDataAttributes } from "./root/AccordionRootDataAttributes";
import { AccordionTriggerDataAttributes } from "./trigger/AccordionTriggerDataAttributes";
import { triggerOpenStateMapping } from "../utils/collapsibleStateMapping";

describe("Accordion enum sync", () => {
  it("names the index attribute per the item, header, trigger, and panel enums", () => {
    const emitted = accordionStateAttributesMapping.index?.(2);

    expect(Object.keys(emitted ?? {})).toEqual(["data-index"]);
    expect(emitted?.["data-index"]).toBe("2");
    for (const dataAttributes of [
      AccordionItemDataAttributes,
      AccordionHeaderDataAttributes,
      AccordionTriggerDataAttributes,
      AccordionPanelDataAttributes,
    ]) {
      expect(dataAttributes.index).toBe("data-index");
    }
  });

  it("reports the open state per the item and panel enums", () => {
    expect(Object.keys(accordionStateAttributesMapping.open?.(true) ?? {})).toEqual([
      AccordionItemDataAttributes.open,
    ]);
    expect(AccordionPanelDataAttributes.open).toBe("data-open");
  });

  it("reports the trigger open state per the trigger enum", () => {
    expect(Object.keys(triggerOpenStateMapping.open?.(true) ?? {})).toEqual([
      AccordionTriggerDataAttributes.panelOpen,
    ]);
  });

  it("exposes the orientation and disabled attributes on the root enum", () => {
    expect(AccordionRootDataAttributes.disabled).toBe("data-disabled");
    expect(AccordionRootDataAttributes.orientation).toBe("data-orientation");
  });
});
