import * as stylex from "@stylexjs/stylex";
import { Meter } from "../../components/ui/Meter";

const styles = stylex.create({ root: { maxWidth: "22rem" } });

export default function BasicMeter() {
  return (
    <Meter.Root value={64} xstyle={styles.root}>
      <Meter.Label>Storage usage</Meter.Label>
      <Meter.Value />
      <Meter.Track>
        <Meter.Indicator />
      </Meter.Track>
    </Meter.Root>
  );
}
