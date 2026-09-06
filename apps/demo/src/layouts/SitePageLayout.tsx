import type { JSX } from "@solidjs/web";

export default function SitePageLayout(props: { children?: JSX.Element }) {
  return (
    <main id="main-content" tabindex="-1">
      {props.children}
    </main>
  );
}
