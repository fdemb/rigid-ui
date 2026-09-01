import * as stylex from "@stylexjs/stylex";
import { useLocation } from "@solidjs/router";
import { For, Loading, Show, createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";

import Link from "./components/Link";
import { Button } from "./components/ui/Button";
import { reactiveStyleAttributes } from "./components/ui/styleProps";
import { components } from "./content/components";
import { primitives } from "./content/primitives";
import { themes, type ThemeName } from "./styles/themes";
import { tokens } from "./styles/tokens.stylex";

const styles = stylex.create({
  root: { backgroundColor: tokens.canvas, color: tokens.text, minHeight: "100vh" },
  skipLink: {
    backgroundColor: tokens.text,
    borderRadius: tokens.radiusSm,
    color: tokens.canvas,
    fontSize: "0.8125rem",
    fontWeight: 650,
    left: "1rem",
    padding: "0.6rem 0.8rem",
    position: "fixed",
    top: "0.75rem",
    transform: "translateY(-200%)",
    zIndex: 50,
    ":focus": { transform: "translateY(0)" },
  },
  header: {
    backgroundColor: tokens.canvas,
    borderBottomColor: tokens.border,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    position: "sticky",
    top: 0,
    zIndex: 30,
  },
  headerInner: {
    alignItems: "center",
    display: "grid",
    gap: "1.5rem",
    gridTemplateColumns: {
      default: "1fr auto",
      "@media (min-width: 64rem)": "13.5rem 1fr auto",
    },
    marginInline: "auto",
    maxWidth: tokens.contentWidth,
    minHeight: "3.75rem",
    paddingInline: "clamp(1rem, 3vw, 2rem)",
  },
  brand: {
    alignItems: "center",
    display: "inline-flex",
    fontSize: "0.9375rem",
    fontWeight: 720,
    gap: "0.55rem",
    letterSpacing: "-0.025em",
    textDecoration: "none",
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: tokens.text,
    borderRadius: tokens.radiusSm,
    color: tokens.canvas,
    display: "inline-flex",
    fontFamily: tokens.fontMono,
    fontSize: "0.65rem",
    height: "1.55rem",
    justifyContent: "center",
    letterSpacing: "-0.04em",
    width: "1.55rem",
  },
  topNav: {
    display: { default: "none", "@media (min-width: 42rem)": "flex" },
    gap: "0.25rem",
  },
  topLink: {
    borderRadius: tokens.radiusSm,
    color: { default: tokens.textMuted, ":hover": tokens.text },
    fontSize: "0.8125rem",
    fontWeight: 560,
    padding: "0.45rem 0.6rem",
    textDecoration: "none",
  },
  actions: { alignItems: "center", display: "flex", gap: "0.4rem" },
  version: {
    color: tokens.textSubtle,
    display: { default: "none", "@media (min-width: 36rem)": "inline" },
    fontFamily: tokens.fontMono,
    fontSize: "0.6875rem",
  },
  shell: {
    display: "grid",
    gridTemplateColumns: { default: "1fr", "@media (min-width: 64rem)": "13.5rem 1fr" },
    marginInline: "auto",
    maxWidth: tokens.contentWidth,
    minHeight: "calc(100vh - 3.75rem)",
    paddingInline: "clamp(1rem, 3vw, 2rem)",
  },
  mobileCatalog: {
    borderBottomColor: tokens.border,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: { default: "flex", "@media (min-width: 64rem)": "none" },
    gap: "0.25rem",
    marginInline: "clamp(1rem, 3vw, 2rem)",
    overflowX: "auto",
    paddingBlock: "0.6rem",
  },
  mobileCatalogLink: {
    borderRadius: tokens.radiusSm,
    color: { default: tokens.textMuted, ":hover": tokens.text },
    flexShrink: 0,
    fontSize: "0.8125rem",
    fontWeight: 580,
    padding: "0.45rem 0.6rem",
    textDecoration: "none",
    ":focus-visible": {
      outlineColor: tokens.focus,
      outlineOffset: 1,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
  sidebar: {
    borderRightColor: tokens.border,
    borderRightStyle: "solid",
    borderRightWidth: 1,
    display: { default: "none", "@media (min-width: 64rem)": "block" },
    height: "calc(100vh - 3.75rem)",
    overflowY: "auto",
    paddingBlock: "2rem 4rem",
    paddingInlineEnd: "1.5rem",
    position: "sticky",
    top: "3.75rem",
  },
  sideGroup: { marginBlockEnd: "1.75rem" },
  sideHeading: {
    fontSize: "0.75rem",
    fontWeight: 650,
    letterSpacing: "-0.01em",
    margin: "0 0 0.55rem",
  },
  sideList: { display: "grid", gap: "0.08rem", listStyle: "none", margin: 0, padding: 0 },
  sideLink: {
    borderRadius: tokens.radiusSm,
    color: { default: tokens.textMuted, ":hover": tokens.text, ":is([aria-current])": tokens.text },
    display: "block",
    fontSize: "0.8125rem",
    paddingBlock: "0.35rem",
    paddingInline: "0.5rem",
    textDecoration: "none",
    ":is([aria-current])": { backgroundColor: tokens.surfaceInteractive, fontWeight: 580 },
    ":focus-visible": {
      outlineColor: tokens.focus,
      outlineOffset: 1,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
  main: { minWidth: 0 },
});

function initialTheme(): ThemeName {
  const saved = localStorage.getItem("rigid-ui-theme");
  if (saved === "light" || saved === "dark" || saved === "grove") return saved;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function Layout(props: { children?: JSX.Element }) {
  const location = useLocation();
  const [theme, setTheme] = createSignal<ThemeName>(initialTheme());
  const themeAttributes = reactiveStyleAttributes(() => stylex.attrs(styles.root, themes[theme()]));
  const isCatalog = () =>
    location.pathname.includes("/components") ||
    location.pathname.includes("/primitives") ||
    location.pathname.includes("/elements");

  function cycleTheme() {
    const next: ThemeName = theme() === "light" ? "dark" : "light";
    setTheme(next);
    localStorage.setItem("rigid-ui-theme", next);
  }

  function current(path: string) {
    return location.pathname.endsWith(path) ? "page" : undefined;
  }

  return (
    <div {...themeAttributes}>
      <a href="#main-content" {...stylex.attrs(styles.skipLink)}>
        Skip to content
      </a>
      <header {...stylex.attrs(styles.header)}>
        <div {...stylex.attrs(styles.headerInner)}>
          <Link href="/" xstyle={styles.brand}>
            <span aria-hidden="true" {...stylex.attrs(styles.brandMark)}>
              R/
            </span>
            Rigid UI
          </Link>
          <nav aria-label="Primary" {...stylex.attrs(styles.topNav)}>
            <Link href="/components" xstyle={styles.topLink}>
              Components
            </Link>
            <Link href="/primitives" xstyle={styles.topLink}>
              Primitives
            </Link>
          </nav>
          <div {...stylex.attrs(styles.actions)}>
            <span {...stylex.attrs(styles.version)}>Solid 2 RC</span>
            <Button
              aria-label={`Switch to ${theme() === "light" ? "dark" : "light"} theme`}
              onClick={cycleTheme}
              size="xs"
              variant="ghost"
            >
              {theme() === "light" ? "Dark" : "Light"}
            </Button>
          </div>
        </div>
      </header>
      <Show when={isCatalog()}>
        <nav aria-label="Catalog" {...stylex.attrs(styles.mobileCatalog)}>
          <Link href="/components" xstyle={styles.mobileCatalogLink}>
            Components
          </Link>
          <Link href="/primitives" xstyle={styles.mobileCatalogLink}>
            Primitives
          </Link>
        </nav>
      </Show>
      <div {...stylex.attrs(isCatalog() && styles.shell)}>
        <Show when={isCatalog()}>
          <aside {...stylex.attrs(styles.sidebar)}>
            <nav aria-label="Documentation">
              <div {...stylex.attrs(styles.sideGroup)}>
                <h2 {...stylex.attrs(styles.sideHeading)}>Components</h2>
                <ul {...stylex.attrs(styles.sideList)}>
                  <For each={components}>
                    {(entry) => (
                      <li>
                        <Link
                          aria-current={current(`/components/${entry.slug}`)}
                          href={`/components/${entry.slug}`}
                          xstyle={styles.sideLink}
                        >
                          {entry.name}
                        </Link>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
              <div {...stylex.attrs(styles.sideGroup)}>
                <h2 {...stylex.attrs(styles.sideHeading)}>Primitives</h2>
                <ul {...stylex.attrs(styles.sideList)}>
                  <For each={primitives}>
                    {(entry) => (
                      <li>
                        <Link
                          aria-current={current(`/primitives/${entry.slug}`)}
                          href={`/primitives/${entry.slug}`}
                          xstyle={styles.sideLink}
                        >
                          {entry.name}
                        </Link>
                      </li>
                    )}
                  </For>
                </ul>
              </div>
            </nav>
          </aside>
        </Show>
        <main id="main-content" tabindex="-1" {...stylex.attrs(styles.main)}>
          <Loading>{props.children}</Loading>
        </main>
      </div>
    </div>
  );
}
