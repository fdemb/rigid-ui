import { createMemo, omit, type Accessor } from "solid-js";
import { applyRef } from "@solidjs/web";
import type { JSX } from "@solidjs/web";
import { mergeProps, type MergeableProps, type PropsGetter } from "./mergeProps";
import { getStateAttributesProps, type StateAttributesMapping } from "./getStateAttributesProps";

export type ElementRef<T extends HTMLElement> = (element: T) => void;

export type ElementState = Record<string, boolean | string | number | undefined | null>;

export interface RenderElementOptions<
  T extends HTMLElement,
  State extends object = Record<string, unknown>,
> {
  props?: MergeableProps | Array<MergeableProps | undefined>;
  state?: (() => State | undefined) | State | undefined;
  stateAttributesMapping?: StateAttributesMapping<State>;
  ref?: ElementRef<T> | Array<ElementRef<T> | undefined>;
  propsGetter?: PropsGetter;
  exclude?: readonly string[];
}

type ClassResolver<State extends object> =
  | string
  | undefined
  | ((state: State) => string | undefined);

type StyleInput = JSX.CSSProperties & Record<string, string | number | undefined>;

type StyleResolver<State extends object> =
  | StyleInput
  | string
  | false
  | undefined
  | ((state: State) => StyleInput | string | false | undefined);

function normalizeStateAccessor<State extends object>(
  state: (() => State | undefined) | State | undefined,
): Accessor<State> {
  if (typeof state === "function") {
    return state as () => State;
  }
  const constant = state;
  return () => constant as State;
}

function createStateAttributesBag(read: Accessor<Record<string, string>>): MergeableProps {
  return new Proxy({} as MergeableProps, {
    get(_target, key) {
      return typeof key === "string" ? read()[key] : undefined;
    },
    has(_target, key) {
      return typeof key === "string" && key in read();
    },
    ownKeys() {
      return Object.keys(read());
    },
    getOwnPropertyDescriptor(_target, key) {
      if (typeof key !== "string" || !(key in read())) return undefined;
      return { enumerable: true, configurable: true, get: () => read()[key] };
    },
  });
}

function canonicalizeInternalBag(bag: MergeableProps): MergeableProps {
  if (!("className" in bag)) return bag;
  const { className: internalClass, ...rest } = bag;
  if ("class" in rest) return rest;
  return { ...rest, class: internalClass };
}

export function renderElement<
  T extends HTMLElement,
  State extends object = Record<string, unknown>,
>(componentProps: object, options: RenderElementOptions<T, State> = {}): MergeableProps {
  const {
    props: internalProps,
    state,
    stateAttributesMapping,
    ref,
    propsGetter,
    exclude,
  } = options;
  const userBag = omit(
    componentProps as Record<string, unknown>,
    "children",
    "ref",
    "class",
    "className",
    "style",
    ...(exclude ?? []),
  ) as unknown as MergeableProps;

  const stateAccessor = normalizeStateAccessor<State>(state);
  const source = componentProps as Record<string, unknown>;

  const resolvedUserBag: MergeableProps = {};
  Object.defineProperty(resolvedUserBag, "class", {
    enumerable: true,
    configurable: true,
    get() {
      const value = (source.class ?? source.className) as ClassResolver<State>;
      return typeof value === "function" ? value(stateAccessor()) : value;
    },
  });
  Object.defineProperty(resolvedUserBag, "style", {
    enumerable: true,
    configurable: true,
    get() {
      const value = source.style as StyleResolver<State>;
      return typeof value === "function" ? value(stateAccessor()) : value;
    },
  });

  const bags: MergeableProps[] = [];
  if (state !== undefined) {
    const stateAttributes = createMemo(() =>
      getStateAttributesProps(stateAccessor(), stateAttributesMapping),
    );
    bags.push(createStateAttributesBag(stateAttributes));
  }
  if (internalProps !== undefined) {
    if (Array.isArray(internalProps)) {
      for (const bag of internalProps) {
        if (bag !== undefined) bags.push(canonicalizeInternalBag(bag));
      }
    } else {
      bags.push(canonicalizeInternalBag(internalProps));
    }
  }
  bags.push(userBag, resolvedUserBag);

  const merged = propsGetter ? mergeProps(...bags, propsGetter) : mergeProps(...bags);

  const refs: Array<ElementRef<T>> = [];
  if (ref !== undefined) {
    if (Array.isArray(ref)) {
      for (const single of ref) {
        if (single !== undefined) refs.push(single);
      }
    } else {
      refs.push(ref);
    }
  }

  refs.push((element: T) => {
    const userRef = source.ref;
    if (typeof userRef === "function" || Array.isArray(userRef)) {
      applyRef(userRef as never, element as unknown as Element);
    }
  });

  Object.defineProperty(merged, "ref", {
    enumerable: true,
    configurable: true,
    get() {
      return [...refs];
    },
  });

  return merged;
}
