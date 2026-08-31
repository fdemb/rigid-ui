import * as stylex from "@stylexjs/stylex";
import { For } from "solid-js";

import { tokens } from "../styles/tokens.stylex";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from "../components/ui/Card";
import { AlertDialog, DialogFooter } from "../components/ui/Dialog";
import { Separator } from "../components/ui/Separator";
import { Tooltip } from "../components/ui/Tooltip";

const rows = [
  ["Commit", "8f21ac4"],
  ["Branch", "main"],
  ["Region", "eu-central-1"],
  ["Duration", "42s"],
] as const;

const styles = stylex.create({
  card: { maxWidth: "27rem", width: "100%" },
  title: { alignItems: "center", display: "flex", gap: "0.5rem" },
  body: { gap: "0.6rem" },
  row: {
    alignItems: "center",
    display: "flex",
    fontSize: "0.8125rem",
    gap: "0.75rem",
    justifyContent: "space-between",
  },
  key: { color: tokens.textMuted },
  value: { fontFamily: tokens.fontMono, fontSize: "0.75rem" },
  actions: { alignItems: "center", display: "flex", gap: "0.5rem" },
  spacer: { flex: 1 },
});

export default function DeploymentBlock() {
  return (
    <Card xstyle={styles.card}>
      <CardHeader divided>
        <CardTitle xstyle={styles.title}>
          api-gateway
          <Badge tone="success">Live</Badge>
        </CardTitle>
        <Badge mono>v2.14.0</Badge>
      </CardHeader>
      <CardBody xstyle={styles.body}>
        <For each={rows}>
          {([key, value], index) => (
            <>
              {index() > 0 && <Separator decorative />}
              <div {...stylex.attrs(styles.row)}>
                <span {...stylex.attrs(styles.key)}>{key}</span>
                <span {...stylex.attrs(styles.value)}>{value}</span>
              </div>
            </>
          )}
        </For>
      </CardBody>
      <CardFooter divided>
        <Tooltip.Root>
          <Tooltip.Trigger size="sm" variant="ghost">
            Logs
          </Tooltip.Trigger>
          <Tooltip.Content>Stream the last 1000 lines</Tooltip.Content>
        </Tooltip.Root>
        <div {...stylex.attrs(styles.spacer)} />
        <Button size="sm" variant="secondary">
          Redeploy
        </Button>
        <AlertDialog.Root>
          <AlertDialog.Trigger size="sm" variant="danger">
            Roll back
          </AlertDialog.Trigger>
          <AlertDialog.Content size="sm">
            <AlertDialog.Title>Roll back to v2.13.4?</AlertDialog.Title>
            <AlertDialog.Description>
              Traffic shifts to the previous release immediately. In-flight requests finish on the
              current one.
            </AlertDialog.Description>
            <DialogFooter>
              <AlertDialog.Close>Cancel</AlertDialog.Close>
              <AlertDialog.Close variant="danger">Roll back</AlertDialog.Close>
            </DialogFooter>
          </AlertDialog.Content>
        </AlertDialog.Root>
      </CardFooter>
    </Card>
  );
}
