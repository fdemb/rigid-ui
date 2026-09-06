import * as stylex from "@stylexjs/stylex";
import { Meter } from "../../components/ui/Meter";

const styles = stylex.create({ root: { maxWidth: "22rem" } });

export default function FormattedMeter() {
  return (
    <Meter.Root
      value={640}
      max={1000}
      locale="en-US"
      format={{ style: "unit", unit: "gigabyte", unitDisplay: "short" }}
      getAriaValueText={(formatted) => `${formatted} of 1,000 GB used`}
      xstyle={styles.root}
    >
      <Meter.Label>Storage usage</Meter.Label>
      <Meter.Value />
      <Meter.Track>
        <Meter.Indicator />
      </Meter.Track>
    </Meter.Root>
  );
}
