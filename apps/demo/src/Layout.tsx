import * as stylex from "@stylexjs/stylex";
import { Loading, createEffect, createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";

import Link from "./components/Link";
import { Bleed, frame } from "./components/Frame";
import { MoonIcon, SunIcon } from "./components/icons";
import { base } from "./components/ui/base";
import { themes, type ThemeName } from "./components/ui/themes";
import { siteThemes } from "./styles/themes";
import { colors, motion, radii, shadows, typography } from "./components/ui/tokens.stylex";
import { siteLayout } from "./styles/site.stylex";

const BRAND_WIDTH = "14rem";

const styles = stylex.create({
  root: {
    backgroundColor: colors.background,
    color: colors.foreground,
    display: "flex",
    flexDirection: "column",
    minHeight: "100vh",
  },
  skipLink: {
    backgroundColor: colors.foreground,
    borderRadius: radii.sm,
    color: colors.background,
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
    backgroundColor: colors.background,
    borderBottomColor: colors.border,
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
      "@media (min-width: 64rem)": `${BRAND_WIDTH} 1fr auto`,
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
    // Compact headers leave the brand cell open.
    borderInlineEndWidth: { default: 0, "@media (min-width: 64rem)": 1 },
    borderInlineEndColor: colors.border,
    borderInlineEndStyle: "solid",
  },
  brandMark: {
    alignItems: "center",
    backgroundColor: colors.foreground,
    borderRadius: radii.sm,
    color: colors.background,
    display: "inline-flex",
    fontFamily: typography.mono,
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
    borderInlineEndColor: colors.border,
    borderInlineEndStyle: "solid",
    borderInlineEndWidth: 1,
    color: { default: colors.mutedForeground, ":hover": colors.foreground },
    display: "inline-flex",
    fontSize: "0.8125rem",
    fontWeight: 560,
    paddingInline: "1.15rem",
    textDecoration: "none",
    transition: `background-color ${motion.fast} ${motion.easing}`,
    ":hover": { backgroundColor: colors.interactive },
    "@media (prefers-reduced-motion: reduce)": { transitionProperty: "none" },
  },
  actions: {
    alignItems: "center",
    borderInlineStartColor: colors.border,
    borderInlineStartStyle: "solid",
    borderInlineStartWidth: 1,
    display: "flex",
    gap: "0.75rem",
    paddingInline: siteLayout.inset,
  },
  themeIcon: { height: "0.875rem", width: "0.875rem" },
  themeSwitcher: {
    alignItems: "center",
    backgroundColor: colors.muted,
    borderColor: colors.borderStrong,
    borderRadius: radii.full,
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
    borderRadius: radii.full,
    borderStyle: "solid",
    borderWidth: 1,
    color: {
      default: colors.subtleForeground,
      ":hover": colors.foreground,
    },
    cursor: "pointer",
    display: "inline-flex",
    height: "1.7rem",
    justifyContent: "center",
    padding: 0,
    transition: `background-color ${motion.fast} ${motion.easing}, color ${motion.fast} ${motion.easing}`,
    width: "1.7rem",
    ":focus-visible": {
      outlineColor: colors.focus,
      outlineOffset: 2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
    "@media (pointer: coarse)": { height: "2.25rem", width: "2.25rem" },
  },
  themeOptionActive: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    color: colors.foreground,
    boxShadow: shadows.sm,
  },
  body: { display: "flex", flexDirection: "column", flexGrow: 1 },
  footer: {
    alignItems: "center",
    color: colors.subtleForeground,
    display: "flex",
    flexWrap: "wrap",
    fontSize: "0.75rem",
    gap: "0.4rem 1.5rem",
    justifyContent: "space-between",
    paddingBlock: "1.25rem",
  },
  footerLink: {
    color: { default: colors.subtleForeground, ":hover": colors.foreground },
    textDecorationColor: colors.border,
  },
});

function initialTheme(): ThemeName {
  const saved = localStorage.getItem("rigid-ui-theme");
  if (saved === "light" || saved === "dark") return saved;
  return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function Layout(props: { children?: JSX.Element }) {
  const [theme, setTheme] = createSignal<ThemeName>(initialTheme());
  createEffect(
    () => stylex.attrs(base.root, themes[theme()], siteThemes[theme()]).class,
    (className) => {
      const classes = className?.split(" ") ?? [];
      document.documentElement.classList.add(...classes);
      // Stable hook for theme-keyed static CSS (code themes). StyleX class
      // names are hashed, so stylesheets outside StyleX read this instead.
      document.documentElement.dataset.siteTheme = theme();
      return () => document.documentElement.classList.remove(...classes);
    },
  );
  function selectTheme(next: "light" | "dark") {
    setTheme(next);
    localStorage.setItem("rigid-ui-theme", next);
  }

  return (
    <div {...stylex.attrs(styles.root)}>
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
            <Link href="/docs" xstyle={styles.topLink}>
              Docs
            </Link>
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
        <Loading>{props.children}</Loading>
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
