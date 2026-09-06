import * as stylex from "@stylexjs/stylex";
import { Skeleton } from "../../components/ui/Skeleton";

const styles = stylex.create({
  root: { display: "grid", gap: "0.5rem", width: "100%", maxWidth: "24rem" },
});

export default function BasicSkeleton() {
  return (
    <div {...stylex.attrs(styles.root)}>
      <div aria-busy="true" aria-label="Loading profile">
        <Skeleton shape="text" width="12rem" />
        <Skeleton height="5rem" />
      </div>
    </div>
  );
}
