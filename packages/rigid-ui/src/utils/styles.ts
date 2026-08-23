export interface StyleInjectionOptions {
  /**
   * Stamped as the `nonce` attribute on the injected `<style>` element, so a `style-src`
   * policy with a nonce source keeps it.
   */
  nonce?: string | undefined;
  /** Skips injection entirely; the app ships the rules itself. */
  disabled?: boolean | undefined;
}

const DISABLE_SCROLLBAR_CLASS_NAME = "rigid-ui-disable-scrollbar";

const STYLE_CONTENT = `.${DISABLE_SCROLLBAR_CLASS_NAME}{scrollbar-width:none}.${DISABLE_SCROLLBAR_CLASS_NAME}::-webkit-scrollbar{display:none}`;

let styleElement: HTMLStyleElement | null = null;

export const styleDisableScrollbar = {
  className: DISABLE_SCROLLBAR_CLASS_NAME,
  inject(options: StyleInjectionOptions = {}) {
    if (options.disabled || typeof document === "undefined") {
      return;
    }

    // A style node can go missing (test cleanup, or the app detaching it); recreate rather than
    // keep stamping a detached element.
    if (!styleElement || !styleElement.isConnected) {
      styleElement = document.createElement("style");
      styleElement.textContent = STYLE_CONTENT;
      document.head.appendChild(styleElement);
    }

    // Keep the shared element's nonce authoritative across roots whose providers disagree, so
    // a late-mounted nonce still lands on the one element that exists.
    if (options.nonce) {
      styleElement.setAttribute("nonce", options.nonce);
    } else {
      styleElement.removeAttribute("nonce");
    }
  },
};
