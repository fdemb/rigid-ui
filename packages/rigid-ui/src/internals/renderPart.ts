import { merge, sharedConfig, untrack } from "solid-js";
import {
  MathMLElements,
  Namespaces,
  SVGElements,
  getNextElement,
  spread,
  type JSX,
} from "@solidjs/web";
import { renderElement, type RenderElementOptions } from "./renderElement";
import type { MergeableProps } from "./mergeProps";

export type RenderPropCallback<State> = (props: MergeableProps, state: State) => JSX.Element;

export type RenderProp<State = Record<string, unknown>> = string | RenderPropCallback<State>;

const TAG_DEFAULTS: Record<string, MergeableProps> = {
  button: { type: "button" },
  img: { alt: "" },
};

function createTagElement(tag: string): Element {
  if (sharedConfig.hydrating) return getNextElement();
  if (SVGElements.has(tag)) return document.createElementNS(Namespaces.svg, tag);
  if (MathMLElements.has(tag)) return document.createElementNS(Namespaces.mathml, tag);
  return document.createElement(tag);
}

export interface RenderPartOptions<
  T extends HTMLElement,
  State extends object = Record<string, unknown>,
> extends RenderElementOptions<T, State> {
  children?: () => JSX.Element;
}

export function renderPart<T extends HTMLElement, State extends object = Record<string, unknown>>(
  tag: string,
  componentProps: object,
  options: RenderPartOptions<T, State> = {},
): JSX.Element {
  const renderProp = untrack(() => (componentProps as { render?: RenderProp<State> }).render);
  const resolvedTag = typeof renderProp === "string" ? renderProp : tag;
  const tagDefaults = typeof renderProp === "function" ? undefined : TAG_DEFAULTS[resolvedTag];

  const internalProps = Array.isArray(options.props) ? options.props : [options.props];

  const bag = renderElement<T, State>(componentProps, {
    ...options,
    props: [tagDefaults, ...internalProps],
    exclude: [...(options.exclude ?? []), "render"],
  });

  const children = options.children;
  Object.defineProperty(bag, "children", {
    enumerable: true,
    configurable: true,
    get: () => (children ? children() : (componentProps as { children?: unknown }).children),
  });

  if (typeof renderProp === "function") {
    const readState =
      typeof options.state === "function"
        ? (options.state as () => State | undefined)
        : () => options.state as State | undefined;
    return renderProp(bag, merge(() => (readState() ?? {}) as State) as State);
  }

  const element = createTagElement(resolvedTag);
  spread(element, bag);
  return element as unknown as JSX.Element;
}
