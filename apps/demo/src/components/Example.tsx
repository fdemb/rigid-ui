import { Show } from "solid-js";
import type { JSX } from "@solidjs/web";

interface ExampleProps {
  title: string;
  /** Optional one-liner shown under the title, e.g. which props to look at. */
  note?: string;
  /** Example source, read at build time with Vite's `?raw` import. */
  src: string;
  children: JSX.Element;
}

export default function Example(props: ExampleProps) {
  return (
    <section class="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
      <div class="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 class="text-sm font-semibold">{props.title}</h2>
        <Show when={props.note}>
          <p class="mt-1 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{props.note}</p>
        </Show>
      </div>
      <div class="flex flex-wrap items-center justify-center gap-3 p-8">{props.children}</div>
      <details>
        <summary class="cursor-pointer select-none border-t border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-50">
          Source
        </summary>
        <pre class="overflow-x-auto border-t border-zinc-200 bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-300">
          <code>{props.src}</code>
        </pre>
      </details>
    </section>
  );
}
