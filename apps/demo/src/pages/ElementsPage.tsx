import * as stylex from "@stylexjs/stylex";
import { For } from "solid-js";
import type { JSX } from "@solidjs/web";

import Page from "../components/Page";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Separator } from "../components/ui/Separator";
import { Skeleton } from "../components/ui/Skeleton";
import { Textarea } from "../components/ui/Textarea";
import DeploymentBlock from "../blocks/DeploymentBlock";
import FeedbackBlock from "../blocks/FeedbackBlock";
import SignInBlock from "../blocks/SignInBlock";
import UsageBlock from "../blocks/UsageBlock";
import { tokens } from "../styles/tokens.stylex";

const styles = stylex.create({
  section: {
    borderColor: tokens.border,
    borderRadius: tokens.radiusLg,
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "hidden",
  },
  sectionHeader: {
    alignItems: "baseline",
    backgroundColor: tokens.surfaceSunken,
    display: "flex",
    gap: "0.6rem",
    justifyContent: "space-between",
    paddingBlock: "0.55rem",
    paddingInline: "0.85rem",
  },
  sectionName: {
    fontFamily: tokens.fontMono,
    fontSize: "0.75rem",
    fontWeight: 500,
    margin: 0,
  },
  sectionNote: { color: tokens.textMuted, fontSize: "0.75rem", margin: 0 },
  row: {
    alignItems: "center",
    backgroundColor: tokens.surface,
    borderTopColor: tokens.border,
    borderTopStyle: "solid",
    borderTopWidth: 1,
    display: "grid",
    gap: "0.75rem",
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 44rem)": "9rem 1fr",
    },
    paddingBlock: "0.7rem",
    paddingInline: "0.85rem",
  },
  rowLabel: {
    color: tokens.textSubtle,
    fontFamily: tokens.fontMono,
    fontSize: "0.6875rem",
  },
  specimens: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: "0.5rem",
  },
  field: { display: "grid", gap: "0.3rem", maxWidth: "22rem", width: "100%" },
  blocks: {
    alignItems: "start",
    display: "grid",
    gap: "1rem",
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 52rem)": "repeat(2, minmax(0, 1fr))",
    },
  },
});

function Section(props: { name: string; note: string; children: JSX.Element }) {
  return (
    <section {...stylex.attrs(styles.section)}>
      <div {...stylex.attrs(styles.sectionHeader)}>
        <h2 {...stylex.attrs(styles.sectionName)}>{props.name}</h2>
        <p {...stylex.attrs(styles.sectionNote)}>{props.note}</p>
      </div>
      {props.children}
    </section>
  );
}

function Row(props: { label: string; children: JSX.Element }) {
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

export default function ElementsPage() {
  return (
    <Page
      eyebrow="Design language"
      title="Elements"
      meta={<Badge mono>8 components</Badge>}
      lede="The styled layer the registry components are built from. Each one is plain StyleX over the token set, so switching themes moves all of them at once."
    >
      <Section name="Button" note="variant × size">
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
        </Row>
        <Row label="state">
          <Button size="sm" variant="primary" disabled>
            disabled
          </Button>
          <Button size="icon" aria-label="Add">
            +
          </Button>
        </Row>
      </Section>

      <Section name="Input · Label · Textarea" note="form field anatomy">
        <Row label="default">
          <div {...stylex.attrs(styles.field)}>
            <Label for="spec-input" required>
              Project name
            </Label>
            <Input id="spec-input" placeholder="api-gateway" />
          </div>
        </Row>
        <Row label="mono / sm">
          <div {...stylex.attrs(styles.field)}>
            <Label for="spec-token">Token</Label>
            <Input id="spec-token" mono size="sm" value="rui_9f2b41c0" />
          </div>
        </Row>
        <Row label="invalid">
          <div {...stylex.attrs(styles.field)}>
            <Label for="spec-invalid">Region</Label>
            <Input id="spec-invalid" invalid value="eu-west-9" />
          </div>
        </Row>
        <Row label="disabled">
          <div {...stylex.attrs(styles.field)}>
            <Label for="spec-disabled">Owner</Label>
            <Input id="spec-disabled" disabled value="platform-team" />
          </div>
        </Row>
        <Row label="textarea">
          <div {...stylex.attrs(styles.field)}>
            <Label for="spec-textarea">Notes</Label>
            <Textarea id="spec-textarea" placeholder="Anything the on-call should know" />
          </div>
        </Row>
      </Section>

      <Section name="Badge" note="tone">
        <Row label="tone">
          <For each={badgeTones}>{(tone) => <Badge tone={tone}>{tone}</Badge>}</For>
        </Row>
        <Row label="mono">
          <Badge mono>v2.14.0</Badge>
          <Badge mono tone="accent">
            8f21ac4
          </Badge>
        </Row>
      </Section>

      <Section name="Separator" note="orientation">
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
      </Section>

      <Section name="Skeleton" note="shape">
        <Row label="text">
          <Skeleton shape="text" width="14rem" />
        </Row>
        <Row label="block">
          <Skeleton width="10rem" height="3.5rem" />
        </Row>
        <Row label="circle">
          <Skeleton shape="circle" width="2.25rem" height="2.25rem" />
        </Row>
      </Section>

      <Section name="Blocks" note="elements composed with primitives">
        <div {...stylex.attrs(styles.row)}>
          <span {...stylex.attrs(styles.rowLabel)}>composed</span>
          <div {...stylex.attrs(styles.blocks)}>
            <SignInBlock />
            <DeploymentBlock />
            <FeedbackBlock />
            <UsageBlock />
          </div>
        </div>
      </Section>
    </Page>
  );
}
