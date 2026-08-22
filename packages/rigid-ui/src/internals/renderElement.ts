import { createEffect, createSignal, omit, type Accessor } from "solid-js";
import type { JSX } from "@solidjs/web";
import { mergeProps, type MergeableProps } from "./mergeProps";
import { getStateAttributesProps, type StateAttributesMapping } from "./getStateAttributesProps";

/**
 * The Solid replacement for Base UI's `useRenderElement` render contract.
 *
 * Base UI's hook returns a React element. Ours returns a prop bag that a part spreads onto a
 * *static* tag — `<button {...renderElement(props, ...)}>` — so the Solid compiler keeps its
 * template-cloning optimizations and the tag decision stays visible at the call site.
 *
 * Responsibilities (same contract as Base UI):
 * - precedence: internal prop bags first, the component's own props last (rightmost wins);
 * - event handlers chain instead of overwrite; the external handler runs first and can stop the
 *   internal ones with `event.preventBaseUIHandler()` (see `./mergeProps`);
 * - `class` concatenates (external class first) and supports `(state) => string`;
 * - `style` merges objects, concatenates CSS strings, and supports `(state) => style`;
 * - `state` renders as `data-*` attributes via `getStateAttributesProps`, applied imperatively
 *   through an internal ref so attribute *names* may change reactively (e.g.
 *   `data-starting-style` ↔ `data-ending-style`), which JSX spreading cannot express;
 * - refs compose: internal refs run before the component's own ref;
 * - `children` and `ref` never land on the DOM; `exclude` strips component-specific keys.
 */

export type ElementRef<T extends HTMLElement> = (element: T) => void;

/** A component state record whose entries render as `data-*` attributes by default. */
export type ElementState = Record<string, boolean | string | number | undefined | null>;

export interface RenderElementOptions<
  T extends HTMLElement,
  State extends Record<string, unknown> = Record<string, unknown>,
> {
  /** Internal prop bags with lower precedence than the component's own props. */
  props?: MergeableProps | Array<MergeableProps | undefined>;
  /**
   * Component state used to resolve function-form `class`/`style` and the `data-*` attributes.
   * Pass an object-returning accessor to keep those reactive.
   */
  state?: (() => State | undefined) | State | undefined;
  /** Per-key overrides of the default state → `data-*` conversion. */
  stateAttributesMapping?: StateAttributesMapping<State>;
  /** Ref callbacks attached before the component's own ref. */
  ref?: ElementRef<T> | Array<ElementRef<T> | undefined>;
  /** Component-specific prop keys stripped from the DOM output, alongside `children`/`ref`. */
  exclude?: readonly string[];
}

type ClassResolver<State extends Record<string, unknown>> =
  | string
  | undefined
  | ((state: State) => string | undefined);

type StyleInput = JSX.CSSProperties & Record<string, string | number | undefined>;

type StyleResolver<State extends Record<string, unknown>> =
  | StyleInput
  | string
  | false
  | undefined
  | ((state: State) => StyleInput | string | false | undefined);

function normalizeStateAccessor<State extends Record<string, unknown>>(
  state: (() => State | undefined) | State | undefined,
): Accessor<State> {
  if (typeof state === "function") {
    return state as () => State;
  }
  const constant = state;
  return () => constant as State;
}

/** Applies a state snapshot as data attributes, diffing attribute names between runs. */
function applyStateAttributes(
  element: HTMLElement,
  next: Record<string, string>,
  previous: Map<string, string>,
) {
  for (const name of previous.keys()) {
    if (!Object.hasOwn(next, name)) {
      element.removeAttribute(name);
    }
  }
  for (const name of Object.keys(next)) {
    const value = next[name];
    if (!previous.has(name) || previous.get(name) !== value) {
      element.setAttribute(name, value);
    }
  }
  previous.clear();
  for (const name of Object.keys(next)) {
    previous.set(name, next[name]);
  }
}

/**
 * Normalizes a bag to the canonical `class` key — Solid's spread runtime routes `class`
 * through its class setter, while `className` would fall through to a literal (lowercased)
 * attribute. Internal bags are plain literals, so copying them is safe.
 */
function canonicalizeInternalBag(bag: MergeableProps): MergeableProps {
  if (!("className" in bag)) return bag;
  const { className: internalClass, ...rest } = bag;
  if ("class" in rest) return rest;
  return { ...rest, class: internalClass };
}
export function renderElement<
  T extends HTMLElement,
  State extends Record<string, unknown> = Record<string, unknown>,
>(
  // Accepts any component props object (including interfaces, which lack index signatures);
  // keys are read dynamically.
  componentProps: object,
  options: RenderElementOptions<T, State> = {},
): MergeableProps {
  const { props: internalProps, state, stateAttributesMapping, ref, exclude } = options;
  // `omit` constrains keys to `keyof T`, but component props are interfaces read dynamically.
  const userBag = omit(
    componentProps as Record<string, unknown>,
    "children",
    "ref",
    "class",
    "className",
    "style",
    ...(exclude ?? []),
  ) as unknown as MergeableProps;

  // Wrap the user bag so function-form `class`/`style` resolve lazily against state while plain
  // values pass through untouched.
  const stateAccessor = normalizeStateAccessor<State>(state);

  const resolvedUserBag: MergeableProps = {};
  let needsWrapper = false;

  if ("class" in componentProps || "className" in componentProps) {
    needsWrapper = true;
    Object.defineProperty(resolvedUserBag, "class", {
      enumerable: true,
      configurable: true,
      get() {
        const value = ((componentProps as Record<string, unknown>).class ??
          (componentProps as Record<string, unknown>).className) as ClassResolver<State>;
        if (typeof value === "function") {
          return value(stateAccessor());
        }
        return value;
      },
    });
  }
  if ("style" in componentProps) {
    needsWrapper = true;
    Object.defineProperty(resolvedUserBag, "style", {
      enumerable: true,
      configurable: true,
      get() {
        const value = (componentProps as Record<string, unknown>).style as StyleResolver<State>;
        if (typeof value === "function") {
          return value(stateAccessor());
        }
        return value;
      },
    });
  }

  // The user bag is always spread; when class/style need lazy resolution they ride in an extra
  // trailing bag so the omit-proxy's other keys stay reactive getters rather than snapshots.
  const bags: MergeableProps[] = [];
  if (internalProps !== undefined) {
    if (Array.isArray(internalProps)) {
      for (const bag of internalProps) {
        if (bag !== undefined) bags.push(canonicalizeInternalBag(bag));
      }
    } else {
      bags.push(canonicalizeInternalBag(internalProps));
    }
  }
  bags.push(userBag);
  if (needsWrapper) {
    bags.push(resolvedUserBag);
  }

  const merged = mergeProps(...bags);

  // Internal refs + the user's ref, composed as an array; the Solid spread runtime flattens
  // arrays and skips falsy entries.
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

  if (state !== undefined) {
    const [elementRef, setElement] = createSignal<T | null>(null);
    const previousAttributes = new Map<string, string>();
    createEffect(
      () => ({ element: elementRef(), state: stateAccessor() }),
      ({ element, state: currentState }) => {
        if (!element) return;
        applyStateAttributes(
          element,
          getStateAttributesProps(currentState, stateAttributesMapping),
          previousAttributes,
        );
      },
    );
    refs.push(setElement as ElementRef<T>);
  }

  if ("ref" in componentProps && typeof componentProps.ref === "function") {
    refs.push(componentProps.ref as ElementRef<T>);
  }

  if (refs.length > 0) {
    Object.defineProperty(merged, "ref", {
      enumerable: true,
      configurable: true,
      get() {
        return [...refs];
      },
    });
  }

  return merged;
}
