import * as stylex from "@stylexjs/stylex";
import { Tabs } from "../../components/ui/Tabs";

const styles = stylex.create({ root: { maxWidth: "28rem", width: "100%" } });

export default function PillTabs() {
  return (
    <Tabs.Root variant="pill" defaultValue="month" xstyle={styles.root}>
      <Tabs.List aria-label="Billing period">
        <Tabs.Tab value="week">Week</Tabs.Tab>
        <Tabs.Tab value="month">Month</Tabs.Tab>
        <Tabs.Tab value="year">Year</Tabs.Tab>
        <Tabs.Tab value="custom" disabled>
          Custom
        </Tabs.Tab>
        <Tabs.Indicator />
      </Tabs.List>
      <Tabs.Panel value="week">Weekly totals reset every Monday.</Tabs.Panel>
      <Tabs.Panel value="month">Monthly totals reset on the 1st.</Tabs.Panel>
      <Tabs.Panel value="year">Yearly totals reset on January 1st.</Tabs.Panel>
      <Tabs.Panel value="custom">Pick a start and end date.</Tabs.Panel>
    </Tabs.Root>
  );
}
