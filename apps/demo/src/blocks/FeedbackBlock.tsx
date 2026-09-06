import * as stylex from "@stylexjs/stylex";
import { createSignal } from "solid-js";

import { tokens } from "../styles/tokens.stylex";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from "../components/ui/Card";
import { Input } from "../components/ui/Input";
import { Label } from "../components/ui/Label";
import { Textarea } from "../components/ui/Textarea";

const LIMIT = 280;

const styles = stylex.create({
  card: { maxWidth: "27rem", width: "100%" },
  field: { display: "grid", gap: "0.35rem" },
  labelRow: { alignItems: "baseline", display: "flex", justifyContent: "space-between" },
  counter: {
    color: tokens.textSubtle,
    fontFamily: tokens.fontMono,
    fontSize: "0.6875rem",
  },
  over: { color: tokens.danger },
  footer: { justifyContent: "space-between" },
});

export default function FeedbackBlock() {
  const [body, setBody] = createSignal("");
  const remaining = () => LIMIT - body().length;

  return (
    <Card xstyle={styles.card}>
      <CardHeader divided>
        <CardTitle>Report an issue</CardTitle>
        <Badge tone="warning">Triage</Badge>
      </CardHeader>
      <CardBody>
        <div {...stylex.attrs(styles.field)}>
          <Label for="issue-title" required>
            Summary
          </Label>
          <Input id="issue-title" placeholder="Scrollbar thumb sticks after resize" />
        </div>
        <div {...stylex.attrs(styles.field)}>
          <div {...stylex.attrs(styles.labelRow)}>
            <Label for="issue-body">Steps to reproduce</Label>
            <span
              {...(remaining() < 0
                ? stylex.attrs(styles.counter, styles.over)
                : stylex.attrs(styles.counter))}
            >
              {remaining()}
            </span>
          </div>
          <Textarea
            id="issue-body"
            invalid={remaining() < 0}
            onInput={(event) => setBody(event.currentTarget.value)}
            placeholder="1. Open the panel&#10;2. Resize the window"
            value={body()}
          />
        </div>
      </CardBody>
      <CardFooter divided xstyle={styles.footer}>
        <Button size="sm" variant="ghost">
          Attach log
        </Button>
        <Button disabled={remaining() < 0} size="sm" variant="primary">
          Submit
        </Button>
      </CardFooter>
    </Card>
  );
}
