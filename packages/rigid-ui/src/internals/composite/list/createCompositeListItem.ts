import { createEffect, createMemo, type Accessor } from "solid-js";
import { useCompositeListContext } from "./CompositeListContext";

/**
 * Solid port of Base UI's `internals/composite/list/useCompositeListItem.ts`. Registers
 * `element()` with the nearest composite list once it is in the DOM, and reports its index, or
 * `-1` while unregistered or outside a list.
 */
export function createCompositeListItem<Metadata>(
  element: Accessor<HTMLElement | undefined>,
  metadata: Metadata,
): Accessor<number> {
  const list = useCompositeListContext<Metadata>();

  createEffect(element, (el) => {
    if (!el || !list) return;
    return list.register(el, metadata);
  });

  return createMemo(() => {
    const el = element();
    return el && list ? (list.map().get(el)?.index ?? -1) : -1;
  });
}
