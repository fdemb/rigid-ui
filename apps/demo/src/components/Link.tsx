import { useHref, useResolvedPath } from "@solidjs/router";
import type { JSX } from "@solidjs/web";

interface LinkProps {
  /** A route path, written without the base — `/dialog`, not `/rigid-ui/dialog`. */
  href: string;
  class?: string;
  children: JSX.Element;
}

/**
 * An anchor whose `href` is resolved against the router's base. The Pages
 * project site serves the demo from `/rigid-ui/`, and the router only claims
 * anchors whose href already starts with that base — a bare `/dialog` is left
 * to the browser, which walks off the site entirely. Resolving here is what
 * keeps both the click interception and the `aria-current`/`data-active`
 * decoration working, so the state attributes need no wiring of their own.
 */
export default function Link(props: LinkProps) {
  const href = useHref(useResolvedPath(() => props.href));
  return (
    <a href={href()} class={props.class}>
      {props.children}
    </a>
  );
}
