export const isWebKit =
  typeof CSS === "undefined" || !CSS.supports
    ? false
    : CSS.supports("-webkit-backdrop-filter:none");
