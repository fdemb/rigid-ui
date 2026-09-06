import { componentSources } from "../content/componentSources";
import { components, type ComponentEntry } from "../content/components";
import CodeBlock from "./CodeBlock";

export default function ComponentSource(props: { slug: ComponentEntry["slug"] }) {
  return (
    <CodeBlock
      path={components.find((entry) => entry.slug === props.slug)?.sourcePath}
      code={componentSources[props.slug] ?? ""}
    />
  );
}
