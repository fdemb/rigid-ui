import * as stylex from "@stylexjs/stylex";
import { Tabs } from "../../components/ui/Tabs";

const styles = stylex.create({ root: { maxWidth: "28rem", width: "100%" } });

export default function BarTabs() {
  return (
    <Tabs.Root defaultValue="overview" xstyle={styles.root}>
      <Tabs.List aria-label="Project">
        <Tabs.Tab value="overview">Overview</Tabs.Tab>
        <Tabs.Tab value="activity">Activity</Tabs.Tab>
        <Tabs.Tab value="settings">Settings</Tabs.Tab>
        <Tabs.Indicator />
      </Tabs.List>
      <Tabs.Panel value="overview">
        Three services, all healthy. Last deploy 2 hours ago.
      </Tabs.Panel>
      <Tabs.Panel value="activity">12 commits and 3 merged pull requests this week.</Tabs.Panel>
      <Tabs.Panel value="settings">Deploys run on every push to main.</Tabs.Panel>
    </Tabs.Root>
  );
}
