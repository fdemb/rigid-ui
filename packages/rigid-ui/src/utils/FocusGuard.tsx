import type { JSX } from "@solidjs/web";

export interface FocusGuardProps {
  ref?: (element: HTMLSpanElement) => void;
  onFocus?: (event: FocusEvent) => void;
  "data-type"?: string;
}

export function FocusGuard(props: FocusGuardProps) {
  const style: JSX.CSSProperties = {
    position: "fixed",
    width: "1px",
    height: "1px",
    margin: "-1px",
    padding: 0,
    border: 0,
    "clip-path": "inset(50%)",
    overflow: "hidden",
    "white-space": "nowrap",
    "word-wrap": "normal",
  };

  return (
    <span
      ref={props.ref}
      data-rigid-ui-focus-guard=""
      data-type={props["data-type"]}
      tabindex={0}
      aria-hidden="true"
      style={style}
      onFocus={(event) => props.onFocus?.(event)}
    />
  );
}
