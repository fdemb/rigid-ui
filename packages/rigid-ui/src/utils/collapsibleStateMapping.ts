import type { StateAttributesMapping } from "../internals/getStateAttributesProps";

/**
 * Solid port of Base UI's
 * `reference/base-ui/packages/react/src/utils/collapsibleOpenStateMapping.ts`.
 * Shared `data-*` vocabulary for collapsible behavior (Accordion parts, and later Collapsible).
 */

const PANEL_OPEN_HOOK = {
  "data-open": "",
};

const PANEL_CLOSED_HOOK = {
  "data-closed": "",
};

const TRIGGER_PANEL_OPEN_HOOK = {
  "data-panel-open": "",
};

export const collapsibleOpenStateMapping = {
  open(value: boolean) {
    if (value) {
      return PANEL_OPEN_HOOK;
    }
    return PANEL_CLOSED_HOOK;
  },
} satisfies StateAttributesMapping<{
  open: boolean;
}>;

export const triggerOpenStateMapping = {
  open(value: boolean) {
    if (value) {
      return TRIGGER_PANEL_OPEN_HOOK;
    }
    return null;
  },
} satisfies StateAttributesMapping<{
  open: boolean;
}>;
