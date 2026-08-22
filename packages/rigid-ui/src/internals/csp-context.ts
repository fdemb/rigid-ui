import { createContext, useContext } from "solid-js";

/**
 * Solid port of Base UI's `internals/csp-context`. Carries the app-level Content Security
 * Policy configuration for inline `<style>` elements that Rigid UI components create.
 */

export interface CSPContextValue {
  /**
   * The nonce value to apply to inline `<style>` tags, so a `style-src` policy with a nonce
   * source keeps them.
   */
  nonce?: string | undefined;
  /**
   * Whether inline `<style>` elements should not be created at all. Apps set this when they ship
   * the equivalent rules themselves.
   * @default false
   */
  disableStyleElements?: boolean | undefined;
}

export const CSPContext = createContext<CSPContextValue | null>(null);

const DEFAULT_CSP_CONTEXT_VALUE: CSPContextValue = {
  disableStyleElements: false,
};

/** Resolves the effective CSP configuration, defaulting to rendering style elements unnonced. */
export function useCSPContext(): CSPContextValue {
  return useContext(CSPContext) ?? DEFAULT_CSP_CONTEXT_VALUE;
}
