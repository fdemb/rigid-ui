import type { JSX } from "@solidjs/web";
import { createMemo } from "solid-js";
import { DirectionContext, type TextDirection } from "../internals/direction-context";

/**
 * Enables RTL behavior for Rigid UI components. Without a provider every component behaves as
 * `"ltr"`, matching Base UI's standalone-part defaults.
 */
export function DirectionProvider(props: DirectionProviderProps) {
  const direction = createMemo(() => props.direction ?? ("ltr" as const));

  return <DirectionContext value={{ direction }}>{props.children}</DirectionContext>;
}

export interface DirectionProviderState {}

export interface DirectionProviderProps {
  children?: JSX.Element;
  /**
   * The reading direction of the text.
   * @default "ltr"
   */
  direction?: TextDirection | undefined;
}

export namespace DirectionProvider {
  export type State = DirectionProviderState;
  export type Props = DirectionProviderProps;
}
