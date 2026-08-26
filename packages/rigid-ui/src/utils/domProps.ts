import type { JSX } from "@solidjs/web";
import type { RenderProp } from "../internals/renderPart";

export type PopupElementRef<T extends HTMLElement> = T | ((element: T) => void);

export type PartProps<
  T extends HTMLElement,
  Attributes extends JSX.HTMLAttributes<T> = JSX.HTMLAttributes<T>,
  State = Record<string, unknown>,
> = Omit<Attributes, "ref" | "class" | "style"> & {
  ref?: PopupElementRef<T> | Array<(element: T) => void>;
  class?: JSX.ClassValue | ((state: State) => string | undefined);
  style?: JSX.CSSProperties | string | ((state: State) => JSX.CSSProperties | string | undefined);
  render?: RenderProp<State>;
};

export type PopupNativeProps<
  T extends HTMLElement,
  Attributes extends JSX.HTMLAttributes<T> = JSX.HTMLAttributes<T>,
  State = Record<string, unknown>,
> = PartProps<T, Attributes, State>;

export function assignRef<T extends HTMLElement>(ref: PopupElementRef<T> | undefined, element: T) {
  if (typeof ref === "function") ref(element);
}

export function callEventHandler<E extends Event>(handler: unknown, event: E) {
  if (typeof handler === "function") {
    (handler as (event: E) => void)(event);
  } else if (Array.isArray(handler) && typeof handler[0] === "function") {
    (handler[0] as (data: unknown, event: E) => void)(handler[1], event);
  }
}

export function mergeStyles(
  base: JSX.CSSProperties & Record<string, string | number | undefined>,
  style: JSX.CSSProperties | string | false | undefined,
): JSX.CSSProperties | string {
  if (typeof style === "string") {
    const serialized = Object.entries(base)
      .filter((entry): entry is [string, string | number] => entry[1] !== undefined)
      .map(
        ([name, value]) =>
          `${name.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}:${value}`,
      )
      .join(";");
    return `${serialized};${style}`;
  }
  return style ? { ...base, ...style } : base;
}
