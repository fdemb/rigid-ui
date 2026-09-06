import * as stylex from "@stylexjs/stylex";
import { For, createSignal } from "solid-js";

import { tokens } from "../styles/tokens.stylex";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardHeader, CardTitle } from "../components/ui/Card";
import { Separator } from "../components/ui/Separator";
import { Skeleton } from "../components/ui/Skeleton";

const metrics = [
  { label: "Requests", value: "1.24M", delta: "+8.2%", tone: "success" as const },
  { label: "Error rate", value: "0.31%", delta: "+0.04pp", tone: "warning" as const },
  { label: "p99 latency", value: "182ms", delta: "-11ms", tone: "success" as const },
];

const styles = stylex.create({
  card: { maxWidth: "27rem", width: "100%" },
  body: { gap: 0, paddingBlock: 0, paddingInline: 0 },
  row: {
    alignItems: "center",
    display: "flex",
    gap: "0.75rem",
    justifyContent: "space-between",
    paddingBlock: "0.7rem",
    paddingInline: "1rem",
  },
  label: { color: tokens.textMuted, fontSize: "0.8125rem" },
  figures: { alignItems: "center", display: "flex", gap: "0.6rem" },
  value: {
    fontFamily: tokens.fontMono,
    fontSize: "0.8125rem",
    fontWeight: 500,
  },
});

export default function UsageBlock() {
  const [loading, setLoading] = createSignal(false);

  return (
    <Card xstyle={styles.card}>
      <CardHeader divided>
        <CardTitle>Last 24 hours</CardTitle>
        <Button onClick={() => setLoading(!loading())} size="xs" variant="outline">
          {loading() ? "Show data" : "Show loading"}
        </Button>
      </CardHeader>
      <CardBody xstyle={styles.body}>
        <For each={metrics}>
          {(metric, index) => (
            <>
              {index() > 0 && <Separator decorative />}
              <div {...stylex.attrs(styles.row)}>
                {loading() ? (
                  <>
                    <Skeleton shape="text" width="6rem" />
                    <Skeleton shape="text" width="4.5rem" />
                  </>
                ) : (
                  <>
                    <span {...stylex.attrs(styles.label)}>{metric.label}</span>
                    <div {...stylex.attrs(styles.figures)}>
                      <span {...stylex.attrs(styles.value)}>{metric.value}</span>
                      <Badge tone={metric.tone}>{metric.delta}</Badge>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </For>
      </CardBody>
    </Card>
  );
}
