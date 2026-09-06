import { For } from "solid-js";
import { components } from "../content/components";
import { primitives } from "../content/primitives";
import Link from "./Link";

export default function DocsCatalog(props: { kind: "components" | "primitives" }) {
  return (
    <div class="docs-catalog">
      <For each={props.kind === "components" ? components : primitives}>
        {(entry) => (
          <Link href={`/${props.kind}/${entry.slug}`}>
            <strong>{entry.name}</strong>
            <p>{entry.description}</p>
          </Link>
        )}
      </For>
    </div>
  );
}
