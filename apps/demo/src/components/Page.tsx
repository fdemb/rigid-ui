import type { JSX } from "@solidjs/web";

export default function Page(props: { title: string; lede: string; children: JSX.Element }) {
  return (
    <div class="mx-auto max-w-5xl px-6 py-10">
      <h1 class="text-2xl font-semibold tracking-tight">{props.title}</h1>
      <p class="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
        {props.lede}
      </p>
      <div class="mt-8 space-y-8">{props.children}</div>
    </div>
  );
}
