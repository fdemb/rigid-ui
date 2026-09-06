import * as stylex from "@stylexjs/stylex";
import { Textarea } from "../../components/ui/Textarea";
import { Label } from "../../components/ui/Label";

const styles = stylex.create({
  root: { display: "grid", gap: "0.5rem", width: "100%", maxWidth: "24rem" },
});

export default function BasicTextarea() {
  return (
    <div {...stylex.attrs(styles.root)}>
      <Label for="message">Message</Label>
      <Textarea id="message" rows={4} placeholder="How can we help?" />
    </div>
  );
}
