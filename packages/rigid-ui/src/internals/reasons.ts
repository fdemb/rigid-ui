/**
 * Solid port of Base UI's `reference/base-ui/packages/react/src/internals/reasons.ts`.
 */
import * as REASONS from "./reason-parts";

export { REASONS };
export type BaseUIEventReasons = typeof REASONS;
export type BaseUIEventReason = BaseUIEventReasons[keyof BaseUIEventReasons];
