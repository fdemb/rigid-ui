import * as stylex from "@stylexjs/stylex";
import { Input } from "../../components/ui/Input";
import { Label } from "../../components/ui/Label";

const styles = stylex.create({
  root: { display: "grid", gap: "0.5rem", width: "100%", maxWidth: "24rem" },
});

export default function BasicInput() {
  return (
    <div {...stylex.attrs(styles.root)}>
      <Label for="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  );
}
