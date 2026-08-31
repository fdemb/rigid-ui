import * as stylex from "@stylexjs/stylex";
import { useHref, useResolvedPath } from "@solidjs/router";
import { omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { mergeProps } from "rigid-ui/primitives/merge-props";

import { reactiveStyleAttributes, type StyleProps } from "./ui/styleProps";

interface LinkProps
  extends
    Omit<JSX.AnchorHTMLAttributes<HTMLAnchorElement>, "class" | "href" | "style">,
    StyleProps {
  href: string;
}

/** Resolve internal links against the demo's deployment base path. */
export default function Link(props: LinkProps) {
  const anchorProps = omit(props, "href", "xstyle");
  const href = useHref(useResolvedPath(() => props.href));
  const attrs = reactiveStyleAttributes(() => stylex.attrs(props.xstyle));

  return <a href={href()} {...mergeProps(attrs, anchorProps)} />;
}
