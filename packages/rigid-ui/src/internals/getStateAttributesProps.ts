/**
 * Solid port of Base UI's
 * `reference/base-ui/packages/react/src/internals/getStateAttributesProps.ts`.
 */

export type StateAttributesMapping<State extends object> = {
  [Property in keyof State]?: (value: State[Property]) => Record<string, string> | null | undefined;
};

/**
 * Converts a component state record into the `data-*` attributes rendered on a part.
 *
 * Default rule per key: `true` renders `data-<lowercased-key>` with an empty value, any other
 * truthy value renders it with `String(value)`, falsy values render nothing. A key present in
 * `customMapping` is delegated to its function instead — returning `null`/`undefined` skips the
 * attribute entirely.
 */
export function getStateAttributesProps<State extends object>(
  state: State,
  customMapping?: StateAttributesMapping<State>,
): Record<string, string> {
  const props: Record<string, string> = {};

  for (const key of Object.keys(state)) {
    const value = (state as Record<string, unknown>)[key];

    if (customMapping && Object.hasOwn(customMapping, key)) {
      const customProps = customMapping[key as keyof State]?.(value as never);
      if (customProps != null) {
        Object.assign(props, customProps);
      }
      continue;
    }

    if (value === true) {
      props[`data-${key.toLowerCase()}`] = "";
    } else if (value !== false && value !== undefined && value !== null) {
      // Empty-string values still render (as an empty attribute), matching DOM semantics.
      props[`data-${key.toLowerCase()}`] = String(value as string | number);
    }
  }

  return props;
}
