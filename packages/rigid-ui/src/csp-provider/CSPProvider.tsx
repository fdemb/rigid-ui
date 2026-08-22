import type { JSX } from "@solidjs/web";
import { CSPContext, type CSPContextValue } from "../internals/csp-context";

/**
 * Provides the Content Security Policy configuration for Rigid UI components that create inline
 * `<style>` tags. Without a provider, style elements are rendered unnonced, matching Base UI's
 * standalone-part defaults.
 */
export function CSPProvider(props: CSPProviderProps) {
  const contextValue: CSPContextValue = {
    get nonce() {
      return props.nonce;
    },
    get disableStyleElements() {
      return props.disableStyleElements;
    },
  };

  return <CSPContext value={contextValue}>{props.children}</CSPContext>;
}

export interface CSPProviderState {}

export interface CSPProviderProps {
  children?: JSX.Element;
  /**
   * The nonce value to apply to inline `<style>` tags.
   */
  nonce?: string | undefined;
  /**
   * Whether inline `<style>` elements created by Rigid UI components should not be rendered.
   * Instead, the app must specify the styles via custom class names or other methods.
   * @default false
   */
  disableStyleElements?: boolean | undefined;
}

export namespace CSPProvider {
  export type State = CSPProviderState;
  export type Props = CSPProviderProps;
}
