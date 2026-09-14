import type { BaseUIChangeEventDetails } from "../../internals/createBaseUIEventDetails";
import type { REASONS } from "../../internals/reasons";

export type AccordionItemChangeEventReason = typeof REASONS.triggerPress | typeof REASONS.none;

export type AccordionItemChangeEventDetails =
  BaseUIChangeEventDetails<AccordionItemChangeEventReason>;
