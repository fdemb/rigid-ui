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
 * Unlike a plain Object.assign, the returned object keeps reactivity: every field is a getter
 * that re-reads the source bags at access time, so spreading the result in JSX tracks the
 * underlying component props. The set of keys is fixed at merge time — a key added to a source
 * object later is not picked up.
 *
 * A bag may be a function ("props getter"). It is invoked once, eagerly, with the merged props
 * accumulated so far (left of it), and its return value replaces that accumulation; the getter
 * is responsible for carrying previous props forward. Handlers it returns are not automatically
 * prevention-aware — such a getter must check `event.baseUIHandlerPrevented` itself.
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
      const snapshot = materialize(sources);
      const replacement = { ...input(snapshot) };
      sources.length = 0;
      sources.push(replacement);
      continue;
    }
    sources.push(input);
  }
  return sources;
}

/** Reads a merged props object into a plain static snapshot of its own keys. */
function materialize(sources: MergeableProps[]) {
  const merged = createMerged(sources);
  const snapshot: MergeableProps = {};
  for (const key of Object.keys(merged)) {
    snapshot[key] = merged[key];
  }
  return snapshot;
}

function createMerged(sources: MergeableProps[]): MergeableProps {
  const keySet = new Set<string>();
  for (const source of sources) {
    for (const key of Object.keys(source)) {
      keySet.add(key);
    }
  }

  const merged: MergeableProps = {};
  for (const key of keySet) {
    Object.defineProperty(merged, key, {
      enumerable: true,
      configurable: true,
      get() {
        let value: unknown;
        let hasValue = false;
        for (const source of sources) {
          if (!(key in source)) continue;
          const nextValue = (source as MergeableProps)[key];
          value = mergeValue(key, hasValue ? value : undefined, nextValue);
          hasValue = true;
        }
        return hasValue ? value : undefined;
      },
    });
  }
  return merged;
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
