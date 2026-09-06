import * as stylex from "@stylexjs/stylex";
import { useLocation } from "@solidjs/router";
import { For } from "solid-js";
import type { JSX } from "@solidjs/web";

import Link from "../components/Link";
import { components } from "../content/components";
import { primitives } from "../content/primitives";
import { tokens } from "../styles/tokens.stylex";
import "../styles/docs.css";

const styles = stylex.create({
  root: {
    "--docs-muted": tokens.textMuted,
    "--docs-border": tokens.border,
    "--docs-wash": tokens.surfaceInteractive,
    "--docs-code": tokens.codeBackground,
    "--docs-code-text": tokens.codeText,
    "--docs-focus": tokens.focus,
    marginInline: "auto",
    maxWidth: tokens.contentWidth,
    width: "100%",
  },
});

function Navigation() {
  const location = useLocation();
  return (
    <nav aria-label="Documentation" class="docs-navigation">
      <Link href="/docs" aria-current={location.pathname.endsWith("/docs") ? "page" : undefined}>
        Introduction
      </Link>
      <For
        each={[
          { title: "Components", path: "/components", entries: components },
          { title: "Primitives", path: "/primitives", entries: primitives },
        ]}
      >
        {(group) => (
          <section>
            <h2>
              <Link
                href={group.path}
                aria-current={location.pathname.endsWith(group.path) ? "page" : undefined}
              >
                {group.title}
              </Link>
            </h2>
            <ul>
              <For each={group.entries}>
                {(entry) => (
                  <li>
                    <Link
                      href={`${group.path}/${entry.slug}`}
                      aria-current={
                        location.pathname.endsWith(`${group.path}/${entry.slug}`)
                          ? "page"
                          : undefined
                      }
                    >
                      {entry.name}
                    </Link>
                  </li>
                )}
              </For>
            </ul>
          </section>
        )}
      </For>
    </nav>
  );
}

export default function DocsLayout(props: { children?: JSX.Element }) {
  return (
    <div {...stylex.attrs(styles.root)}>
      <details
        class="docs-mobile-navigation"
        onClick={(event) => {
          if (event.target instanceof Element && event.target.closest("a"))
            event.currentTarget.open = false;
        }}
      >
        <summary>Browse documentation</summary>
        <Navigation />
      </details>
      <div class="docs-layout">
        <aside class="docs-sidebar">
          <Navigation />
        </aside>
        <main id="main-content" tabindex="-1" class="docs-main">
          {props.children}
        </main>
      </div>
    </div>
  );
}
