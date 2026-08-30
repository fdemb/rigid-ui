/**
 * Classifies pointer types that carry mouse hover semantics. Mirrors the non-strict form of Base
 * UI's `isMouseLikePointerType` (`floating-ui-react/utils/event.ts`): missing and empty values
 * count as mouse input, because synthetic and replayed pointer sequences omit the pointer type.
 * `pen` counts because some Linux/Chromium setups report a real mouse as `pen`
 * (floating-ui/floating-ui#2015).
 */
export function isMouseLikePointerType(pointerType: string | null | undefined): boolean {
  return (
    pointerType == null || pointerType === "" || pointerType === "mouse" || pointerType === "pen"
  );
}
