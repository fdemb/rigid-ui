import * as stylex from "@stylexjs/stylex";
import { Separator } from "../../components/ui/Separator";

const styles = stylex.create({
  root: { display: "grid", gap: "0.5rem", width: "100%", maxWidth: "24rem" },
});

export default function BasicSeparator() {
  return (
    <div {...stylex.attrs(styles.root)}>
      <Separator decorative />
    </div>
  );
}
