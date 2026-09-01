import * as stylex from "@stylexjs/stylex";
import { For, Match, Show, Switch } from "solid-js";
import type { JSX } from "@solidjs/web";

import type { ComponentEntry } from "../content/components";
import { components } from "../content/components";
import { componentSources } from "../content/componentSources";
import { tokens } from "../styles/tokens.stylex";
import Band, { BandHeader, frame } from "./Frame";
import CodeBlock from "./CodeBlock";
import Example from "./Example";
import { Matrix, VariantMatrix, variantAxes } from "./VariantMatrix";
import Link from "./Link";
import Page from "./Page";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardBody, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/Card";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Separator } from "./ui/Separator";
import { Skeleton } from "./ui/Skeleton";
import { Textarea } from "./ui/Textarea";

const styles = stylex.create({
  specimen: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.65rem",
    justifyContent: "center",
    maxWidth: "34rem",
    width: "100%",
  },
  field: { display: "grid", gap: "0.4rem", maxWidth: "22rem", width: "100%" },
  card: { maxWidth: "24rem", width: "100%" },
  sourceSection: { paddingBlock: "1.25rem" },
  copy: {
    color: tokens.textMuted,
    fontSize: "0.875rem",
    lineHeight: 1.65,
    margin: "0 0 0.9rem",
    maxWidth: "46rem",
  },
  links: { display: "flex", flexWrap: "wrap" },
  textLink: {
    borderInlineEndColor: tokens.border,
    borderInlineEndStyle: "solid",
    borderInlineEndWidth: 1,
    color: { default: tokens.textMuted, ":hover": tokens.text },
    fontSize: "0.8125rem",
    paddingBlock: "0.85rem",
    paddingInline: tokens.inset,
    textDecoration: "none",
    transition: `background-color ${tokens.durationFast} ${tokens.easing}`,
    ":hover": { backgroundColor: tokens.surfaceInteractive },
    "@media (prefers-reduced-motion: reduce)": { transitionProperty: "none" },
  },
});

const snippets: Record<string, string> = {
  button: `<Button variant="primary">Save changes</Button>`,
  input: `<Input aria-label="Project name" placeholder="api-gateway" />`,
  label: `<Label for="email" required>Email</Label>`,
  textarea: `<Textarea aria-label="Notes" placeholder="Add a note" />`,
  badge: `<Badge tone="success">Ready</Badge>`,
  card: `<Card>\n  <CardHeader><CardTitle>Deployment</CardTitle></CardHeader>\n  <CardBody>...</CardBody>\n</Card>`,
  separator: `<Separator decorative />`,
  skeleton: `<Skeleton shape="text" width="12rem" />`,
};

function Preview(props: { slug: string }): JSX.Element {
  return (
    <Switch
      fallback={
        <div {...stylex.attrs(styles.field)}>
          <Skeleton shape="text" width="45%" />
          <Skeleton shape="text" width="82%" />
          <Skeleton height="5rem" />
        </div>
      }
    >
      <Match when={props.slug === "button"}>
        <div {...stylex.attrs(styles.specimen)}>
          <Button variant="primary">Save changes</Button>
          <Button>Cancel</Button>
          <Button variant="outline">Preview</Button>
          <Button variant="danger">Delete</Button>
        </div>
      </Match>
      <Match when={props.slug === "input"}>
        <div {...stylex.attrs(styles.field)}>
          <Label for="project-name">Project name</Label>
          <Input id="project-name" placeholder="api-gateway" />
          <Input aria-label="Invalid region" invalid value="eu-west-9" />
        </div>
      </Match>
      <Match when={props.slug === "label"}>
        <div {...stylex.attrs(styles.field)}>
          <Label for="work-email" required>
            Work email
          </Label>
          <Input id="work-email" placeholder="you@company.com" />
        </div>
      </Match>
      <Match when={props.slug === "textarea"}>
        <div {...stylex.attrs(styles.field)}>
          <Label for="notes">Release notes</Label>
          <Textarea id="notes" placeholder="What changed in this release?" />
        </div>
      </Match>
      <Match when={props.slug === "badge"}>
        <div {...stylex.attrs(styles.specimen)}>
          <Badge>Draft</Badge>
          <Badge tone="accent">Review</Badge>
          <Badge tone="success">Ready</Badge>
          <Badge tone="warning">Paused</Badge>
          <Badge tone="danger">Failed</Badge>
        </div>
      </Match>
      <Match when={props.slug === "card"}>
        <Card xstyle={styles.card}>
          <CardHeader divided>
            <CardTitle>Production</CardTitle>
            <CardDescription>Warsaw region</CardDescription>
          </CardHeader>
          <CardBody>All services are responding normally.</CardBody>
          <CardFooter divided>
            <Badge tone="success">Healthy</Badge>
          </CardFooter>
        </Card>
      </Match>
      <Match when={props.slug === "separator"}>
        <div {...stylex.attrs(styles.specimen)}>
          <span>Overview</span>
          <Separator orientation="vertical" />
          <span>Activity</span>
          <Separator orientation="vertical" />
          <span>Settings</span>
        </div>
      </Match>
    </Switch>
  );
}

export default function ComponentDetail(props: { component: ComponentEntry }) {
  return (
    <Page title={props.component.name} lede={props.component.description}>
      <Example title="Preview" src={snippets[props.component.slug] ?? ""}>
        <Preview slug={props.component.slug} />
      </Example>
      <Show when={variantAxes[props.component.slug]}>
        <Matrix name="Variants">
          <VariantMatrix slug={props.component.slug} />
        </Matrix>
      </Show>
      <Band bare>
        <BandHeader title="Source" note={props.component.sourcePath} />
        <div {...stylex.attrs(frame.inset, styles.sourceSection)}>
          <p {...stylex.attrs(styles.copy)}>Copy and paste the following code into your project.</p>
          <CodeBlock
            path={props.component.sourcePath}
            code={componentSources[props.component.slug] ?? ""}
          />
        </div>
      </Band>
      <Band bare>
        <BandHeader title="Related" />
        <div {...stylex.attrs(styles.links)}>
          <Link href="/components" xstyle={styles.textLink}>
            All components
          </Link>
          <For
            each={components
              .filter(
                (item) =>
                  item.group === props.component.group && item.slug !== props.component.slug,
              )
              .slice(0, 3)}
          >
            {(item) => (
              <Link href={`/components/${item.slug}`} xstyle={styles.textLink}>
                {item.name}
              </Link>
            )}
          </For>
        </div>
      </Band>
    </Page>
  );
}
