import type { JSX } from "@solidjs/web";

import { CodePanel } from "./CodeBlock";

function MdxPre(props: JSX.IntrinsicElements["pre"]) {
  const fence = findFencedCode(props.children);
  if (fence) {
    return <CodePanel code={fence.text} collapsible={false} lang={fence.lang} />;
  }
  return <pre {...props} />;
}

/*
 * MDX renders the `code` mapping before `pre` sees it, so by the time this
 * runs the child is a real `<code>` element carrying the `language-*` class
 * and the raw source as its text. Anything else falls back to a plain `pre`.
 */
function findFencedCode(children: unknown): { lang: string; text: string } | undefined {
  const items = Array.isArray(children) ? children : [children];
  for (const item of items) {
    if (typeof Element !== "undefined" && item instanceof Element) {
      const code = item.tagName === "CODE" ? item : item.querySelector(":scope > code");
      if (code) {
        const lang = (code.getAttribute("class") ?? "").match(/language-([\w+-]+)/)?.[1];
        return { lang: lang ?? "tsx", text: code.textContent ?? "" };
      }
    }
  }
  return undefined;
}

// MDX emits string defaults for Markdown tags. Solid 2's createComponent
// requires functions, so these mappings compile each tag as a native element.
const components = {
  h1: (props: JSX.IntrinsicElements["h1"]) => <h1 {...props} />,
  h2: (props: JSX.IntrinsicElements["h2"]) => <h2 {...props} />,
  h3: (props: JSX.IntrinsicElements["h3"]) => <h3 {...props} />,
  h4: (props: JSX.IntrinsicElements["h4"]) => <h4 {...props} />,
  h5: (props: JSX.IntrinsicElements["h5"]) => <h5 {...props} />,
  h6: (props: JSX.IntrinsicElements["h6"]) => <h6 {...props} />,
  section: (props: JSX.IntrinsicElements["section"]) => <section {...props} />,
  sup: (props: JSX.IntrinsicElements["sup"]) => <sup {...props} />,
  p: (props: JSX.IntrinsicElements["p"]) => <p {...props} />,
  pre: (props: JSX.IntrinsicElements["pre"]) => <MdxPre {...props} />,
  code: (props: JSX.IntrinsicElements["code"] & { className?: string }) => (
    <code {...props} class={props.class ?? props.className} />
  ),
  a: (props: JSX.IntrinsicElements["a"]) => (
    <a
      {...props}
      href={
        typeof props.href === "string" && props.href.startsWith("/")
          ? `${import.meta.env.BASE_URL.replace(/\/$/, "")}${props.href}`
          : props.href
      }
    />
  ),
  ul: (props: JSX.IntrinsicElements["ul"]) => <ul {...props} />,
  ol: (props: JSX.OlHTMLAttributes<HTMLOListElement>) => <ol {...props} />,
  li: (props: JSX.IntrinsicElements["li"]) => <li {...props} />,
  strong: (props: JSX.IntrinsicElements["strong"]) => <strong {...props} />,
  em: (props: JSX.IntrinsicElements["em"]) => <em {...props} />,
  del: (props: JSX.IntrinsicElements["del"]) => <del {...props} />,
  blockquote: (props: JSX.IntrinsicElements["blockquote"]) => <blockquote {...props} />,
  hr: (props: JSX.IntrinsicElements["hr"]) => <hr {...props} />,
  br: (props: JSX.IntrinsicElements["br"]) => <br {...props} />,
  table: (props: JSX.IntrinsicElements["table"]) => <table {...props} />,
  thead: (props: JSX.IntrinsicElements["thead"]) => <thead {...props} />,
  tbody: (props: JSX.IntrinsicElements["tbody"]) => <tbody {...props} />,
  tr: (props: JSX.IntrinsicElements["tr"]) => <tr {...props} />,
  th: (props: JSX.ThHTMLAttributes<HTMLTableCellElement>) => <th {...props} />,
  td: (props: JSX.TdHTMLAttributes<HTMLTableCellElement>) => <td {...props} />,
  img: (props: JSX.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
  input: (props: JSX.InputHTMLAttributes<HTMLInputElement>) => <input {...props} />,
};

export function useMDXComponents() {
  return components;
}
