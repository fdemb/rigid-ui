/**
 * Solid port of Base UI's `merge-props` package
 * (`reference/base-ui/packages/react/src/merge-props/mergeProps.ts`).
 *
 * Merges multiple prop bags following Object.assign precedence: the rightmost bag's fields win.
 * Event handlers are chained instead of overwritten — the rightmost handler runs first, then the
 * next-left, and so on. A handler can stop the remaining (more internal) handlers by calling
 * `event.preventBaseUIHandler()`; the flag lives on the DOM event object itself because Solid
 * hands components native events rather than synthetic wrappers.
 *
 * Unlike a plain Object.assign, the returned object keeps reactivity: it is a proxy that re-reads
 * the source bags at access time, so spreading the result in JSX tracks the underlying component
 * props. Keys are resolved on demand too, so a source that gains a key later is picked up and
 * enumerating the result never reads a value.
 *
 * A bag may be a function ("props getter"). It is invoked once with the props accumulated so far
 * (left of it) and its return value replaces that accumulation; the getter is responsible for
 * carrying previous props forward. Both the argument and the return value stay live, so a getter
 * must read through them rather than spreading them into a plain object. Handlers it returns are
 * not automatically prevention-aware — such a getter must check `event.baseUIHandlerPrevented`
 * itself.
 *
 * `ref` is deliberately not given merge semantics; compose refs explicitly instead.
 */

export interface BaseUIHandledEvent {
  /** Set to `true` once `preventBaseUIHandler()` has been called. */
  baseUIHandlerPrevented?: boolean;
  /** Called by external handlers to stop the more-internal handlers of the chain. */
  preventBaseUIHandler(): void;
}

type AnyFunction = (...args: any[]) => unknown;

export type PropsGetter = (previousProps: Record<string, unknown>) => Record<string, unknown>;

/**
 * Deliberately `any`-valued, matching Base UI's prop bags: consumers destructure handlers and
 * re-invoke them, which `Record<string, unknown>` makes impossible without casts everywhere.
 */
export type MergeableProps = Record<string, any>;

function isEventHandlerKey(key: string) {
  // Matches /^on[A-Z]/ without allocating a regex or substring.
  return (
    key.length > 2 &&
    key.charCodeAt(0) === 111 /* o */ &&
    key.charCodeAt(1) === 110 /* n */ &&
    key.charCodeAt(2) >= 65 /* A */ &&
    key.charCodeAt(2) <= 90 /* Z */
  );
}

function isEventLike(value: unknown): value is object & BaseUIHandledEvent {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { preventDefault?: unknown }).preventDefault === "function" &&
    typeof (value as { type?: unknown }).type === "string" &&
    typeof (value as { stopPropagation?: unknown }).stopPropagation === "function"
  );
}

/**
 * Attaches the `preventBaseUIHandler()` / `baseUIHandlerPrevented` protocol to an event object.
 * Idempotent; safe to call on every dispatch.
 */
export function makeEventPreventable<T extends object>(event: T): T & BaseUIHandledEvent {
  const target = event as T & BaseUIHandledEvent;
  if (isEventLike(target)) {
    target.preventBaseUIHandler = () => {
      target.baseUIHandlerPrevented = true;
    };
    if (target.baseUIHandlerPrevented !== true) {
      target.baseUIHandlerPrevented = false;
    }
  }
  return target;
}

/** Concatenates two class names with the later one appearing first (Base UI order). */
export function mergeClassNames(
  previousClassName: string | undefined,
  nextClassName: string | undefined,
) {
  if (nextClassName) {
    if (previousClassName) {
      return `${nextClassName} ${previousClassName}`;
    }
    return nextClassName;
  }
  return previousClassName;
}

function serializeStyleObject(style: Record<string, string | number | undefined>) {
  const parts: string[] = [];
  for (const name of Object.keys(style)) {
    const value = style[name];
    if (value === undefined) continue;
    const kebab = name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    parts.push(`${kebab}:${value}`);
  }
  return parts.join(";");
}

/**
 * Merges two style declarations, supporting the CSS-string form consumers use for pseudo-element
 * styling. When both sides are objects the rightmost wins per property; when a string is involved
 * the declarations are concatenated with `;` so cascade order (later declaration wins conflicts)
 * matches the merge direction.
 */
function mergeStyles(
  previousStyle: unknown,
  nextStyle: unknown,
): Record<string, string | number | undefined> | string | undefined {
  if (previousStyle === undefined || previousStyle === null) {
    return nextStyle as Record<string, string | number | undefined> | string | undefined;
  }
  if (nextStyle === undefined || nextStyle === null) {
    return previousStyle as Record<string, string | number | undefined>;
  }
  const previousIsString = typeof previousStyle === "string";
  const nextIsString = typeof nextStyle === "string";
  if (!previousIsString && !nextIsString) {
    return {
      ...(previousStyle as Record<string, string | number | undefined>),
      ...(nextStyle as Record<string, string | number | undefined>),
    };
  }
  if (!previousIsString && nextIsString) {
    const serialized = serializeStyleObject(
      previousStyle as Record<string, string | number | undefined>,
    );
    return serialized ? `${serialized};${nextStyle}` : (nextStyle as string);
  }
  if (previousIsString && !nextIsString) {
    const serialized = serializeStyleObject(
      nextStyle as Record<string, string | number | undefined>,
    );
    return serialized ? `${previousStyle};${serialized}` : (previousStyle as string);
  }
  return `${previousStyle as string};${nextStyle as string}`;
}

function wrapWithPrevention(handler: AnyFunction) {
  return (...args: unknown[]) => {
    const firstArg = args[0];
    if (isEventLike(firstArg)) {
      makeEventPreventable(firstArg);
    }
    return handler(...(args as Parameters<typeof handler>));
  };
}

/**
 * Chains two handlers into one. The right-hand (later merged, more external) handler runs first;
 * the left-hand chain is skipped when the event was marked with `preventBaseUIHandler()`.
 * Non-event first arguments (custom callbacks like `onOpenChange(open, details)`) run every
 * handler with no prevention capability.
 */
function chainEventHandlers(
  previousHandler: AnyFunction | undefined,
  nextHandler: AnyFunction | undefined,
): AnyFunction | undefined {
  if (!nextHandler) {
    return previousHandler;
  }
  const wrappedNext = wrapWithPrevention(nextHandler);
  if (!previousHandler) {
    return wrappedNext;
  }
  return (...args: unknown[]) => {
    const firstArg = args[0];
    const result = wrappedNext(...args);
    if (!(isEventLike(firstArg) && firstArg.baseUIHandlerPrevented === true)) {
      previousHandler(...args);
    }
    return result;
  };
}

function mergeValue(key: string, previousValue: unknown, nextValue: unknown) {
  // Both spellings merge as class names: `class` is what the Solid spread runtime consumes,
  // `className` what Base UI-style bags are written with.
  if (key === "className" || key === "class") {
    return mergeClassNames(previousValue as string | undefined, nextValue as string | undefined);
  }
  if (key === "style") {
    return mergeStyles(previousValue, nextValue);
  }
  if (isEventHandlerKey(key)) {
    return chainEventHandlers(
      previousValue as AnyFunction | undefined,
      nextValue as AnyFunction | undefined,
    );
  }
  // Plain value: the rightmost bag containing the key decides, even when the value is undefined.
  return nextValue;
}

function isPropsGetter(input: unknown): input is PropsGetter {
  return typeof input === "function";
}

/**
 * Resolves the bag list into a flat sequence of plain prop objects. Props getters are evaluated
 * once, eagerly, with a synchronous snapshot of everything merged so far — and their result
 * replaces that accumulation entirely, exactly like Base UI's merge.
 */
function resolveInputs(inputs: Array<MergeableProps | PropsGetter | undefined>) {
  const sources: MergeableProps[] = [];
  for (const input of inputs) {
    if (input === undefined || input === null) continue;
    if (isPropsGetter(input)) {
      const previous = createMerged([...sources]);
      const replacement = input(previous);
      sources.length = 0;
      sources.push(replacement);
      continue;
    }
    sources.push(input);
  }
  return sources;
}

function readMerged(sources: MergeableProps[], key: string) {
  let value: unknown;
  let hasValue = false;
  for (const source of sources) {
    if (!(key in source)) continue;
    const nextValue = (source as MergeableProps)[key];
    value = mergeValue(key, hasValue ? value : undefined, nextValue);
    hasValue = true;
  }
  return hasValue ? value : undefined;
}

function createMerged(sources: MergeableProps[]): MergeableProps {
  const own: MergeableProps = {};

  return new Proxy(own, {
    get(target, key, receiver) {
      if (typeof key !== "string") return Reflect.get(target, key, receiver);
      if (Object.hasOwn(target, key)) return Reflect.get(target, key, receiver);
      return readMerged(sources, key);
    },
    has(target, key) {
      if (Reflect.has(target, key)) return true;
      if (typeof key !== "string") return false;
      return sources.some((source) => key in source);
    },
    ownKeys(target) {
      const keys = new Set<string>(Object.keys(target));
      for (const source of sources) {
        for (const key of Object.keys(source)) keys.add(key);
      }
      return [...keys];
    },
    getOwnPropertyDescriptor(target, key) {
      if (Object.hasOwn(target, key)) return Reflect.getOwnPropertyDescriptor(target, key);
      if (typeof key !== "string") return undefined;
      if (!sources.some((source) => key in source)) return undefined;
      return {
        enumerable: true,
        configurable: true,
        get: () => readMerged(sources, key),
      };
    },
  });
}

/**
 * A view of `source` with `keys` hidden. Unlike Solid's `omit`, the key set is resolved on every
 * read, so a key that appears later (a state attribute switching on) is picked up.
 */
export function omitProps(source: MergeableProps, ...keys: string[]): MergeableProps {
  const blocked = new Set(keys);
  const visible = (key: string | symbol): key is string =>
    typeof key === "string" && !blocked.has(key);

  return new Proxy({} as MergeableProps, {
    get(_target, key) {
      return visible(key) ? source[key] : undefined;
    },
    has(_target, key) {
      return visible(key) && key in source;
    },
    ownKeys() {
      return Object.keys(source).filter((key) => !blocked.has(key));
    },
    getOwnPropertyDescriptor(_target, key) {
      if (!visible(key) || !(key in source)) return undefined;
      return { enumerable: true, configurable: true, get: () => source[key] };
    },
  });
}

export function mergeProps(
  ...inputs: Array<MergeableProps | PropsGetter | undefined>
): MergeableProps {
  return createMerged(resolveInputs(inputs));
}

/**
 * Variant of {@link mergeProps} taking an arbitrary number of prop bags as an array.
 * Slightly lower performance than the variadic form; prefer {@link mergeProps} for ≤5 bags.
 */
export function mergePropsN(
  inputs: Array<MergeableProps | PropsGetter | undefined>,
): MergeableProps {
  if (inputs.length === 0) {
    return {};
  }
  return createMerged(resolveInputs(inputs));
}
