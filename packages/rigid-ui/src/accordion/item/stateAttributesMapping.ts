import type { StateAttributesMapping } from "../../internals/getStateAttributesProps";
import { transitionStatusMapping } from "../../internals/stateAttributesMapping";
import { collapsibleOpenStateMapping } from "../../utils/collapsibleStateMapping";
import type { AccordionItemState } from "./AccordionItemContext";
import { AccordionItemDataAttributes } from "./AccordionItemDataAttributes";

export const accordionStateAttributesMapping = {
  ...collapsibleOpenStateMapping,
  index: (value: number) => ({ [AccordionItemDataAttributes.index]: String(value) }),
  ...transitionStatusMapping,
  value: () => null,
} satisfies StateAttributesMapping<AccordionItemState>;
