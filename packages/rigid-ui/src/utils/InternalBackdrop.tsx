import { createEffect, createSignal, omit } from "solid-js";
import type { JSX } from "@solidjs/web";

export interface InternalBackdropProps extends JSX.HTMLAttributes<HTMLDivElement> {
  ref?: (element: HTMLDivElement) => void;
  /** The element to cut out of the backdrop, keeping it interactive underneath. */
  cutout?: Element | null | undefined;
}

export function InternalBackdrop(props: InternalBackdropProps) {
  const others = omit(props, "ref", "cutout", "style");
  const [element, setElement] = createSignal<HTMLDivElement>();
  const [rect, setRect] = createSignal<DOMRect | null>(null);

  createEffect(
    () => [element(), props.cutout ?? null] as const,
    ([backdrop, cutout]) => {
      if (!backdrop || !cutout) return;
      setRect(cutout.getBoundingClientRect());
      const observer = new ResizeObserver(() => setRect(cutout.getBoundingClientRect()));
      observer.observe(backdrop);
      observer.observe(cutout);
      return () => observer.disconnect();
    },
  );

  return (
    <div
      {...others}
      ref={(node) => {
        setElement(node);
        props.ref?.(node);
      }}
      role="presentation"
      data-rigid-ui-inert=""
      style={{
        position: "fixed",
        inset: "0",
        "user-select": "none",
        ...(rect()
          ? {
              "clip-path":
                `polygon(0% 0%,100% 0%,100% 100%,0% 100%,0% 0%,` +
                `${rect()!.left}px ${rect()!.top}px,${rect()!.left}px ${rect()!.bottom}px,` +
                `${rect()!.right}px ${rect()!.bottom}px,${rect()!.right}px ${rect()!.top}px,` +
                `${rect()!.left}px ${rect()!.top}px)`,
            }
          : {}),
        ...(props.style as JSX.CSSProperties),
      }}
    />
  );
}
