const DISABLE_SCROLLBAR_CLASS_NAME = "base-ui-disable-scrollbar";

const STYLE_CONTENT = `.${DISABLE_SCROLLBAR_CLASS_NAME}{scrollbar-width:none}.${DISABLE_SCROLLBAR_CLASS_NAME}::-webkit-scrollbar{display:none}`;

let styleInjected = false;

export const styleDisableScrollbar = {
  className: DISABLE_SCROLLBAR_CLASS_NAME,
  inject() {
    if (styleInjected || typeof document === "undefined") {
      return;
    }
    const style = document.createElement("style");
    style.textContent = STYLE_CONTENT;
    document.head.appendChild(style);
    styleInjected = true;
  },
};
