import GithubSlugger from "github-slugger";
import { For, createMemo, createEffect } from "solid-js";
import type { JSX } from "@solidjs/web";

export default function DocPage(props: {
  children?: JSX.Element;
  sections: string[];
  title: string;
}) {
  const links = createMemo(() => {
    const slugger = new GithubSlugger();
    return props.sections.map((title) => ({ title, id: slugger.slug(title) }));
  });
  createEffect(
    () => props.title,
    (title) => {
      const previous = document.title;
      document.title = `${title} - Rigid UI`;
      return () => {
        document.title = previous;
      };
    },
  );
  return (
    <div class="docs-page">
      <article class="docs-prose">{props.children}</article>
      <aside class="docs-outline">
        <nav aria-label="On this page">
          <p>On this page</p>
          <For each={links()}>{(section) => <a href={`#${section.id}`}>{section.title}</a>}</For>
        </nav>
      </aside>
    </div>
  );
}
