import * as stylex from "@stylexjs/stylex";
import { For, Loading, createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";

import Link from "./components/Link";
import { Button } from "./components/ui/Button";
import { reactiveStyleAttributes } from "./components/ui/styleProps";
import { themes, type ThemeName } from "./styles/themes";
import { tokens } from "./styles/tokens.stylex";

const navItems = [
  { href: "/elements", label: "Elements" },
  { href: "/components", label: "Components" },
  { href: "/primitives", label: "Primitives" },
];

const themeNames: ThemeName[] = ["light", "dark", "grove"];

const styles = stylex.create({
  root: {
    backgroundColor: tokens.canvas,
    color: tokens.text,
    minHeight: "100vh",
  },
  header: {
    backgroundColor: tokens.canvas,
    borderBottomColor: tokens.border,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    position: "sticky",
    top: 0,
    zIndex: 20,
  },
  headerInner: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "1rem",
    minHeight: "3.25rem",
    justifyContent: "space-between",
    marginInline: "auto",
    maxWidth: tokens.contentWidth,
    paddingBlock: "0.5rem",
    paddingInline: "clamp(1.25rem, 4vw, 2rem)",
  },
  brand: {
    color: tokens.text,
    fontFamily: tokens.fontMono,
    fontSize: "0.8125rem",
    fontWeight: 500,
    letterSpacing: "-0.01em",
    textDecoration: "none",
  },
  nav: { alignItems: "center", display: "flex", gap: "0.25rem" },
  navLink: {
    borderRadius: tokens.radiusSm,
    color: {
      default: tokens.textMuted,
      ":hover": tokens.text,
      ":is([data-active])": tokens.text,
    },
    display: "inline-flex",
    fontSize: "0.8125rem",
    fontWeight: 500,
    padding: "0.4rem 0.6rem",
    "@media (pointer: coarse)": {
      alignItems: "center",
      minHeight: "2.75rem",
    },
    textDecoration: "none",
  },
  themeButton: {
    fontFamily: tokens.fontMono,
    fontWeight: 500,
    minWidth: "4.2rem",
  },
});

function initialTheme(): ThemeName {
  const saved = localStorage.getItem("rigid-ui-theme");
  if (saved === "light" || saved === "dark" || saved === "grove") return saved;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function Layout(props: { children?: JSX.Element }) {
  const [theme, setTheme] = createSignal<ThemeName>(initialTheme());
  const themeAttributes = reactiveStyleAttributes(() => stylex.attrs(styles.root, themes[theme()]));

  function cycleTheme() {
    const currentIndex = themeNames.indexOf(theme());
    const next = themeNames[(currentIndex + 1) % themeNames.length]!;
    setTheme(next);
    localStorage.setItem("rigid-ui-theme", next);
  }

  return (
    <div {...themeAttributes}>
      <header {...stylex.attrs(styles.header)}>
        <div {...stylex.attrs(styles.headerInner)}>
          <Link href="/" xstyle={styles.brand}>
            rigid/ui
          </Link>
          <nav aria-label="Main navigation" {...stylex.attrs(styles.nav)}>
            <For each={navItems}>
              {(item) => (
                <Link href={item.href} xstyle={styles.navLink}>
                  {item.label}
                </Link>
              )}
            </For>
            <Button
              aria-label={`Current theme: ${theme()}. Switch theme.`}
              onClick={cycleTheme}
              size="xs"
              variant="outline"
              xstyle={styles.themeButton}
            >
              {theme()}
            </Button>
          </nav>
        </div>
      </header>
      <main>
        <Loading>{props.children}</Loading>
      </main>
    </div>
  );
}
