/**
 * Solid port of Base UI's `internals/composite/constants.ts`.
 */

export const ARROW_UP = "ArrowUp";
export const ARROW_DOWN = "ArrowDown";
export const ARROW_LEFT = "ArrowLeft";
export const ARROW_RIGHT = "ArrowRight";
export const HOME = "Home";
export const END = "End";
export const PAGE_UP = "PageUp";
export const PAGE_DOWN = "PageDown";

export const COMPOSITE_KEYS = new Set([ARROW_UP, ARROW_DOWN, ARROW_LEFT, ARROW_RIGHT, HOME, END]);

export const SHIFT = "Shift" as const;
export const MODIFIER_KEYS = [SHIFT, "Control", "Alt", "Meta"] as const;
export type ModifierKey = (typeof MODIFIER_KEYS)[number];
