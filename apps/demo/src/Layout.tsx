import * as stylex from "@stylexjs/stylex";
import { useLocation } from "@solidjs/router";
import { For, Loading, Show, createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";

import Link from "./components/Link";
import { Bleed, frame } from "./components/Frame";
import { MoonIcon, SunIcon } from "./components/icons";
import { reactiveStyleAttributes } from "./components/ui/styleProps";
import { components } from "./content/components";
import { primitives } from "./content/primitives";
import { themes, type ThemeName } from "./styles/themes";
import { tokens } from "./styles/tokens.stylex";

/**
 * The sidebar column, and the header cell the sidebar rail runs up through.
 * They share a width so the two draw one continuous line.
 */
const RAIL = "14rem";

const styles = stylex.create({
  root: {
    backgroundColor: tokens.canvas,
    color: tokens.text,
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
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
    alignItems: "stretch",
    display: "grid",
    gridTemplateColumns: {
      default: "auto 1fr auto",
      "@media (min-width: 64rem)": `${RAIL} 1fr auto`,
    },
    minHeight: "3.75rem",
  },
  brand: {
    alignItems: "center",
    display: "inline-flex",
    fontSize: "0.9375rem",
    fontWeight: 720,
    gap: "0.55rem",
    letterSpacing: "-0.025em",
    paddingInlineEnd: "1rem",
    textDecoration: "none",
    // Below the sidebar breakpoint the rail has nothing to continue into.
    borderInlineEndWidth: { default: 0, "@media (min-width: 64rem)": 1 },
    borderInlineEndColor: tokens.border,
    borderInlineEndStyle: "solid",
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: tokens.text,
    borderRadius: tokens.radiusSm,
    color: tokens.canvas,
    display: "inline-flex",
    fontFamily: tokens.fontMono,
    fontSize: "0.65rem",
    height: "1.4rem",
    justifyContent: "center",
    letterSpacing: "-0.04em",
    width: "1.4rem",
  },
  topNav: {
    alignItems: "stretch",
    display: { default: "none", "@media (min-width: 42rem)": "flex" },
  },
  topLink: {
    alignItems: "center",
    borderInlineEndColor: tokens.border,
    borderInlineEndStyle: "solid",
    borderInlineEndWidth: 1,
    color: { default: tokens.textMuted, ":hover": tokens.text },
    display: "inline-flex",
    fontSize: "0.8125rem",
    fontWeight: 560,
    paddingInline: "1.15rem",
    textDecoration: "none",
    transition: `background-color ${tokens.durationFast} ${tokens.easing}`,
    ":hover": { backgroundColor: tokens.surfaceInteractive },
    "@media (prefers-reduced-motion: reduce)": { transitionProperty: "none" },
  },
  actions: {
    alignItems: "center",
    borderInlineStartColor: tokens.border,
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: 1,
    display: "flex",
    gap: "0.75rem",
    paddingInline: tokens.inset,
  },
  themeIcon: { height: "0.875rem", width: "0.875rem" },
  themeSwitcher: {
    alignItems: "center",
    backgroundColor: tokens.surfaceSunken,
    borderColor: tokens.borderStrong,
    borderRadius: tokens.radiusFull,
    borderStyle: "solid",
    borderWidth: 1,
    display: "inline-flex",
    gap: "0.1rem",
    padding: "0.2rem",
  },
  themeOption: {
    alignItems: "center",
    appearance: "none",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: tokens.radiusFull,
    borderStyle: "solid",
    borderWidth: 1,
    color: {
      default: tokens.textSubtle,
      ":hover": tokens.text,
    },
    cursor: "pointer",
    display: "inline-flex",
    height: "1.7rem",
    justifyContent: "center",
    padding: 0,
    transition: `background-color ${tokens.durationFast} ${tokens.easing}, color ${tokens.durationFast} ${tokens.easing}`,
    width: "1.7rem",
    ":focus-visible": {
      outlineColor: tokens.focus,
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
    "@media (pointer: coarse)": { height: "2.25rem", width: "2.25rem" },
  },
  themeOptionActive: {
    backgroundColor: tokens.surface,
    borderColor: tokens.border,
    color: tokens.text,
    boxShadow: tokens.shadowSm,
  },
  body: { display: "flex", flexDirection: "column", flexGrow: 1 },
  catalogBleed: {
    borderBottomColor: tokens.border,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: { default: "block", "@media (min-width: 64rem)": "none" },
  },
  catalogBar: { display: "flex", overflowX: "auto" },
  mobileCatalogLink: {
    borderInlineEndColor: tokens.border,
    borderInlineEndStyle: "solid",
    borderInlineEndWidth: 1,
    color: { default: tokens.textMuted, ":hover": tokens.text },
    flexShrink: 0,
    fontSize: "0.8125rem",
    fontWeight: 580,
    paddingBlock: "0.7rem",
    paddingInline: tokens.inset,
    textDecoration: "none",
    ":focus-visible": {
      outlineColor: tokens.focus,
      outlineOffset: -2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
  /*
   * A catalog page sits in the rails and splits into sidebar plus content; a
   * full-width page draws no rails here at all, because its own bands do.
   */
  shell: { display: "grid", gridTemplateColumns: "1fr" },
  shellBleed: { width: "100%" },
  shellWithSidebar: {
    borderInlineColor: tokens.border,
    borderInlineStyle: "solid",
    borderInlineWidth: 1,
    gridTemplateColumns: { default: "1fr", "@media (min-width: 64rem)": `${RAIL} 1fr` },
    marginInline: "auto",
    maxWidth: tokens.contentWidth,
    width: "100%",
  },
  sidebar: {
    borderInlineEndColor: tokens.border,
    borderInlineEndStyle: "solid",
    borderInlineEndWidth: 1,
    display: { default: "none", "@media (min-width: 64rem)": "block" },
    height: "calc(100vh - 3.75rem)",
    overflowY: "auto",
    position: "sticky",
    top: "3.75rem",
  },
  sideGroup: {
    borderBottomColor: tokens.border,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    paddingBlock: "1.25rem 1.5rem",
  },
  sideHeading: {
    color: tokens.textMuted,
    fontSize: "0.6875rem",
    fontWeight: 640,
    letterSpacing: "0.05em",
    margin: "0 0 0.5rem",
    paddingInline: tokens.inset,
    textTransform: "uppercase",
  },
  sideList: { listStyle: "none", margin: 0, padding: 0 },
  sideLink: {
    borderInlineStartColor: { default: "transparent", ":is([aria-current])": tokens.text },
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: 2,
    color: { default: tokens.textMuted, ":hover": tokens.text, ":is([aria-current])": tokens.text },
    display: "block",
    fontSize: "0.8125rem",
    paddingBlock: "0.4rem",
    paddingInline: `calc(${tokens.inset} - 2px)`,
    textDecoration: "none",
    ":hover": { backgroundColor: tokens.surfaceInteractive },
    ":is([aria-current])": { backgroundColor: tokens.surfaceInteractive, fontWeight: 580 },
    ":focus-visible": {
      outlineColor: tokens.focus,
      outlineOffset: -2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
  main: { minWidth: 0 },
  footer: {
    alignItems: "center",
    color: tokens.textSubtle,
    display: "flex",
    flexWrap: "wrap",
    fontSize: "0.75rem",
    gap: "0.4rem 1.5rem",
    justifyContent: "space-between",
    paddingBlock: "1.25rem",
  },
  footerLink: {
    color: { default: tokens.textSubtle, ":hover": tokens.text },
    textDecorationColor: tokens.border,
  },
});

function initialTheme(): ThemeName {
  const saved = localStorage.getItem("rigid-ui-theme");
  if (saved === "light" || saved === "dark") return saved;
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

  function selectTheme(next: "light" | "dark") {
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
        <div {...stylex.attrs(frame.column, styles.headerInner)}>
          <Link href="/" xstyle={[frame.inset, styles.brand]}>
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
            <div aria-label="Theme" role="group" {...stylex.attrs(styles.themeSwitcher)}>
              <button
                type="button"
                aria-label="Light theme"
                aria-pressed={theme() === "light" ? "true" : "false"}
                onClick={() => selectTheme("light")}
                {...stylex.attrs(
                  styles.themeOption,
                  theme() === "light" && styles.themeOptionActive,
                )}
              >
                <SunIcon aria-hidden="true" {...stylex.attrs(styles.themeIcon)} />
              </button>
              <button
                type="button"
                aria-label="Dark theme"
                aria-pressed={theme() === "dark" ? "true" : "false"}
                onClick={() => selectTheme("dark")}
                {...stylex.attrs(
                  styles.themeOption,
                  theme() === "dark" && styles.themeOptionActive,
                )}
              >
                <MoonIcon aria-hidden="true" {...stylex.attrs(styles.themeIcon)} />
              </button>
            </div>
          </div>
        </div>
      </header>
      <div {...stylex.attrs(styles.body)}>
        <Show when={isCatalog()}>
          <div {...stylex.attrs(styles.catalogBleed)}>
            <nav aria-label="Catalog" {...stylex.attrs(frame.column, styles.catalogBar)}>
              <Link href="/components" xstyle={styles.mobileCatalogLink}>
                Components
              </Link>
              <Link href="/primitives" xstyle={styles.mobileCatalogLink}>
                Primitives
              </Link>
            </nav>
          </div>
        </Show>
        <div
          {...stylex.attrs(styles.shell, isCatalog() ? styles.shellWithSidebar : styles.shellBleed)}
        >
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
        <div aria-hidden="true" {...stylex.attrs(frame.column, frame.runout)} />
        <Bleed bare rule="top">
          <div {...stylex.attrs(frame.inset, styles.footer)}>
            <span>Built for the Solid 2 release candidate.</span>
            <a
              href="https://github.com/fdemb/rigid-ui"
              rel="noreferrer"
              {...stylex.attrs(styles.footerLink)}
            >
              github.com/fdemb/rigid-ui
            </a>
          </div>
        </Bleed>
      </div>
    </div>
  );
}
