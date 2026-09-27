import { createContext, createMemo, createSignal, useContext, type Accessor } from "solid-js";

/**
 * Solid port of Base UI's `internals/composite/list/CompositeList.tsx`.
 *
 * Items register their element with live metadata (an object of getters, never a snapshot), and
 * the list derives a DOM-ordered map from the registrations. Base UI spreads metadata into each
 * map entry; here it stays nested so its getters keep tracking.
 */

export interface CompositeListEntry<Metadata> {
  index: number;
  metadata: Metadata;
}

export type CompositeListMap<Metadata> = ReadonlyMap<HTMLElement, CompositeListEntry<Metadata>>;

export interface CompositeListContextValue<Metadata = unknown> {
  register(element: HTMLElement, metadata: Metadata): () => void;
  map: Accessor<CompositeListMap<Metadata>>;
}

export interface CompositeList<Metadata> extends CompositeListContextValue<Metadata> {
  /** Registered elements ordered by index. */
  elements: Accessor<HTMLElement[]>;
}

export function createCompositeList<Metadata>(): CompositeList<Metadata> {
  const registrations = new Map<HTMLElement, Metadata>();
  const [version, setVersion] = createSignal(0);

  const map = createMemo<CompositeListMap<Metadata>>(() => {
    version();
    const sorted = Array.from(registrations.keys()).sort(sortByDocumentPosition);
    const next = new Map<HTMLElement, CompositeListEntry<Metadata>>();
    sorted.forEach((element, index) => {
      next.set(element, { index, metadata: registrations.get(element) as Metadata });
    });
    return next;
  });

  const elements = createMemo(() => Array.from(map().keys()));

  return {
    map,
    elements,
    register(element, metadata) {
      registrations.set(element, metadata);
      setVersion((v) => v + 1);
      return () => {
        if (registrations.get(element) !== metadata) return;
        registrations.delete(element);
        setVersion((v) => v + 1);
      };
    },
  };
}

function sortByDocumentPosition(a: Element, b: Element) {
  // `CONTAINED_BY` is always reported alongside `FOLLOWING`, and `CONTAINS` alongside
  // `PRECEDING`, so testing `FOLLOWING` alone orders siblings and nested items alike.
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

export const CompositeListContext = createContext<CompositeListContextValue<any> | null>(null);

export function useCompositeListContext<Metadata>() {
  return useContext(CompositeListContext) as CompositeListContextValue<Metadata> | null;
}
