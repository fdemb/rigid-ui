import type { JSX } from "@solidjs/web";

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
  pre: (props: JSX.IntrinsicElements["pre"]) => <pre {...props} />,
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
