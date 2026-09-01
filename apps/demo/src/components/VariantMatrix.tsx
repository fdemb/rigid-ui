import * as stylex from "@stylexjs/stylex";
import { For, Match, Show, Switch } from "solid-js";
import type { JSX } from "@solidjs/web";

import { tokens } from "../styles/tokens.stylex";
import { Badge } from "./ui/Badge";
import { Button } from "./ui/Button";
import { Card, CardBody, CardDescription, CardFooter, CardHeader, CardTitle } from "./ui/Card";
import { Input } from "./ui/Input";
import { Label } from "./ui/Label";
import { Separator } from "./ui/Separator";
import { Skeleton } from "./ui/Skeleton";
import { Textarea } from "./ui/Textarea";

const styles = stylex.create({
  matrix: {
    borderColor: tokens.border,
    borderRadius: tokens.radiusLg,
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    alignItems: "baseline",
    backgroundColor: tokens.surfaceSunken,
    display: "flex",
    gap: "0.6rem",
    justifyContent: "space-between",
    paddingBlock: "0.55rem",
    paddingInline: "0.85rem",
  },
  name: { fontFamily: tokens.fontMono, fontSize: "0.75rem", fontWeight: 500, margin: 0 },
  note: { color: tokens.textMuted, fontSize: "0.75rem", margin: 0 },
  row: {
    alignItems: "center",
    backgroundColor: tokens.surface,
    borderTopColor: tokens.border,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: { default: "1fr", "@media (min-width: 44rem)": "9rem 1fr" },
    paddingBlock: "0.7rem",
    paddingInline: "0.85rem",
  },
  rowLabel: { color: tokens.textSubtle, fontFamily: tokens.fontMono, fontSize: "0.6875rem" },
  specimens: { alignItems: "center", display: "flex", flexWrap: "wrap", gap: "0.5rem" },
  field: { display: "grid", gap: "0.3rem", maxWidth: "22rem", width: "100%" },
  stretch: { width: "100%" },
  card: { maxWidth: "22rem", width: "100%" },
});

/**
 * The bordered panel a matrix sits in. The Elements overview labels each panel
 * with the component name; a component's own page has an `h2` above it already,
 * so it passes no name and gets the box alone.
 */
export function Matrix(props: { name?: string; note?: string; children: JSX.Element }) {
  return (
    <section {...stylex.attrs(styles.matrix)}>
      <Show when={props.name}>
        {(name) => (
          <div {...stylex.attrs(styles.header)}>
            <h3 {...stylex.attrs(styles.name)}>{name()}</h3>
            <p {...stylex.attrs(styles.note)}>{props.note}</p>
          </div>
        )}
      </Show>
      {props.children}
    </section>
  );
}

/** One axis of a matrix: the prop being varied, then every value it takes. */
export function Row(props: { label: string; children: JSX.Element }) {
  return (
    <div {...stylex.attrs(styles.row)}>
      <span {...stylex.attrs(styles.rowLabel)}>{props.label}</span>
      <div {...stylex.attrs(styles.specimens)}>{props.children}</div>
    </div>
  );
}

const buttonVariants = ["primary", "secondary", "outline", "ghost", "danger"] as const;
const buttonSizes = ["xs", "sm", "md", "lg"] as const;
const badgeTones = ["neutral", "accent", "success", "warning", "danger"] as const;

/**
 * The axes each component varies on, shown as the panel note. Doubles as the
 * test for whether a component has a matrix at all: the primitive-backed ones
 * (Dialog, Popover, Tooltip, Scroll area) document behaviour on their own pages
 * instead.
 */
export const variantAxes: Record<string, string> = {
  button: "variant × size × state",
  input: "size × state",
  label: "state",
  textarea: "state",
  card: "interactive × divided",
  separator: "orientation",
  badge: "tone",
  skeleton: "shape",
};

/** Every value of every variant prop the component accepts. */
export function VariantMatrix(props: { slug: string }) {
  return (
    <Switch>
      <Match when={props.slug === "button"}>
        <Row label="variant">
          <For each={buttonVariants}>
            {(variant) => (
              <Button variant={variant} size="sm">
                {variant}
              </Button>
            )}
          </For>
        </Row>
        <Row label="size">
          <For each={buttonSizes}>{(size) => <Button size={size}>{size}</Button>}</For>
          <Button size="icon" aria-label="Add">
            +
          </Button>
        </Row>
        <Row label="disabled">
          <For each={buttonVariants}>
            {(variant) => (
              <Button variant={variant} size="sm" disabled>
                {variant}
              </Button>
            )}
          </For>
        </Row>
        <Row label="block">
          <Button size="sm" block>
            Full width
          </Button>
        </Row>
      </Match>

      <Match when={props.slug === "input"}>
        <Row label="size">
          <div {...stylex.attrs(styles.field)}>
            <Input size="sm" aria-label="Small" placeholder="sm" />
            <Input aria-label="Medium" placeholder="md" />
          </div>
        </Row>
        <Row label="mono">
          <div {...stylex.attrs(styles.field)}>
            <Input mono aria-label="Token" value="rui_9f2b41c0" />
          </div>
        </Row>
        <Row label="invalid">
          <div {...stylex.attrs(styles.field)}>
            <Input invalid aria-label="Region" value="eu-west-9" />
          </div>
        </Row>
        <Row label="disabled">
          <div {...stylex.attrs(styles.field)}>
            <Input disabled aria-label="Owner" value="platform-team" />
          </div>
        </Row>
      </Match>

      <Match when={props.slug === "label"}>
        <Row label="default">
          <div {...stylex.attrs(styles.field)}>
            <Label for="matrix-label-default">Project name</Label>
            <Input id="matrix-label-default" placeholder="api-gateway" />
          </div>
        </Row>
        <Row label="required">
          <div {...stylex.attrs(styles.field)}>
            <Label for="matrix-label-required" required>
              Work email
            </Label>
            <Input id="matrix-label-required" placeholder="you@company.com" />
          </div>
        </Row>
      </Match>

      <Match when={props.slug === "textarea"}>
        <Row label="default">
          <div {...stylex.attrs(styles.field)}>
            <Textarea aria-label="Notes" placeholder="What changed in this release?" />
          </div>
        </Row>
        <Row label="mono">
          <div {...stylex.attrs(styles.field)}>
            <Textarea mono aria-label="Patch" value={"--- a/main.ts\n+++ b/main.ts"} />
          </div>
        </Row>
        <Row label="invalid">
          <div {...stylex.attrs(styles.field)}>
            <Textarea invalid aria-label="Summary" value="Too short" />
          </div>
        </Row>
        <Row label="disabled">
          <div {...stylex.attrs(styles.field)}>
            <Textarea disabled aria-label="Locked" value="Archived release" />
          </div>
        </Row>
      </Match>

      <Match when={props.slug === "card"}>
        <Row label="default">
          <Card xstyle={styles.card}>
            <CardHeader>
              <CardTitle>Production</CardTitle>
              <CardDescription>Warsaw region</CardDescription>
            </CardHeader>
            <CardBody>All services are responding normally.</CardBody>
          </Card>
        </Row>
        <Row label="divided">
          <Card xstyle={styles.card}>
            <CardHeader divided>
              <CardTitle>Deployment</CardTitle>
            </CardHeader>
            <CardBody>Rolling out to three of nine nodes.</CardBody>
            <CardFooter divided>
              <Badge tone="success">Healthy</Badge>
            </CardFooter>
          </Card>
        </Row>
        <Row label="interactive">
          <Card interactive xstyle={styles.card}>
            <CardBody>Hover to see the border respond.</CardBody>
          </Card>
        </Row>
      </Match>

      <Match when={props.slug === "separator"}>
        <Row label="horizontal">
          <Separator />
        </Row>
        <Row label="vertical">
          <Badge>one</Badge>
          <Separator orientation="vertical" />
          <Badge>two</Badge>
          <Separator orientation="vertical" />
          <Badge>three</Badge>
        </Row>
        <Row label="decorative">
          <Separator decorative />
        </Row>
      </Match>

      <Match when={props.slug === "badge"}>
        <Row label="tone">
          <For each={badgeTones}>{(tone) => <Badge tone={tone}>{tone}</Badge>}</For>
        </Row>
        <Row label="mono">
          <Badge mono>v2.14.0</Badge>
          <Badge mono tone="accent">
            8f21ac4
          </Badge>
        </Row>
      </Match>

      <Match when={props.slug === "skeleton"}>
        <Row label="block">
          <Skeleton width="10rem" height="3.5rem" />
        </Row>
        <Row label="text">
          <div {...stylex.attrs(styles.stretch)}>
            <Skeleton shape="text" width="14rem" />
            <Skeleton shape="text" width="9rem" />
          </div>
        </Row>
        <Row label="circle">
          <Skeleton shape="circle" width="2.25rem" height="2.25rem" />
        </Row>
      </Match>
    </Switch>
  );
}
