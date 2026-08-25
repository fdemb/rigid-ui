import { For } from "solid-js";

const components = [
  {
    href: "/dialog",
    name: "Dialog",
    description:
      "Modal and non-modal dialogs with focus management, scroll lock, and CSS-transition support.",
    examples: 2,
  },
  {
    href: "/alert-dialog",
    name: "Alert dialog",
    description:
      "A modal dialog for interruptions and confirmations that cannot be dismissed by clicking outside.",
    examples: 1,
  },
  {
    href: "/popover",
    name: "Popover",
    description:
      "Anchored popups positioned with Floating UI: hover intent, arrows, and shared popups that glide between triggers.",
    examples: 3,
  },
  {
    href: "/tooltip",
    name: "Tooltip",
    description:
      "Hover and focus hints with shared delays, hoverable content, and Floating UI positioning.",
    examples: 1,
  },
  {
    href: "/scroll-area",
    name: "Scroll Area",
    description:
      "Custom scrollbars over native scrolling on both axes, with hover and scrolling visibility.",
    examples: 2,
  },
];

export default function Home() {
  return (
    <div class="mx-auto max-w-5xl px-6 py-10">
      <h1 class="text-2xl font-semibold tracking-tight">Rigid UI</h1>
      <p class="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        Unstyled Solid components modeled on Base UI's API. Every example below renders live, and
        each one ships its source — copy it straight into your app and style it however you like.
      </p>
      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <For each={components}>
          {(component) => (
            <a
              href={component.href}
              class="rounded-xl border border-zinc-200 p-5 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              <div class="flex items-baseline justify-between gap-2">
                <h2 class="font-semibold">{component.name}</h2>
                <span class="text-xs text-zinc-400 dark:text-zinc-500">
                  {component.examples} examples
                </span>
              </div>
              <p class="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {component.description}
              </p>
            </a>
          )}
        </For>
      </div>
    </div>
  );
}
