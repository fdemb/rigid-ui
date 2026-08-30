import { For, Loading, Show, createSignal } from "solid-js";
import type { JSX } from "@solidjs/web";

import Link from "./components/Link";

const navItems = [
  { href: "/dialog", label: "Dialog" },
  { href: "/popover", label: "Popover" },
  { href: "/tooltip", label: "Tooltip" },
  { href: "/scroll-area", label: "Scroll Area" },
];

function NavLink(props: { href: string; label: string }) {
  return (
    <Link
      href={props.href}
      class="rounded-md px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 data-active:bg-zinc-100 data-active:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 dark:data-active:bg-zinc-800 dark:data-active:text-zinc-50"
    >
      {props.label}
    </Link>
  );
}

function ThemeToggle() {
  const [dark, setDark] = createSignal(document.documentElement.classList.contains("dark"));
  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      aria-pressed={dark() ? "true" : "false"}
      onClick={() => {
        const next = !dark();
        setDark(next);
        document.documentElement.classList.toggle("dark", next);
        localStorage.setItem("theme", next ? "dark" : "light");
      }}
      class="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-blue-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="size-4.5"
      >
        <Show
          when={dark()}
          fallback={
            <path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" />
          }
        >
          <path d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
        </Show>
      </svg>
    </button>
  );
}

export default function Layout(props: { children?: JSX.Element }) {
  return (
    <div class="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <header class="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div class="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <Link href="/" class="font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            rigid-ui
          </Link>
          <nav class="-mr-2 flex items-center gap-0.5">
            <For each={navItems}>{(item) => <NavLink {...item} />}</For>
            <ThemeToggle />
          </nav>
        </div>
      </header>
      <main>
        <Loading>{props.children}</Loading>
      </main>
    </div>
  );
}
