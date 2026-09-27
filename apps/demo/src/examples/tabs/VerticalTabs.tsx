import * as stylex from "@stylexjs/stylex";
import { Tabs } from "../../components/ui/Tabs";

const styles = stylex.create({ root: { maxWidth: "32rem", width: "100%" } });

export default function VerticalTabs() {
  return (
    <Tabs.Root orientation="vertical" defaultValue="general" xstyle={styles.root}>
      <Tabs.List aria-label="Settings" activateOnFocus>
        <Tabs.Tab value="general">General</Tabs.Tab>
        <Tabs.Tab value="members">Members</Tabs.Tab>
        <Tabs.Tab value="billing">Billing</Tabs.Tab>
        <Tabs.Indicator />
      </Tabs.List>
      <Tabs.Panel value="general">Workspace name, region, and default branch.</Tabs.Panel>
      <Tabs.Panel value="members">Invite people and manage their roles.</Tabs.Panel>
      <Tabs.Panel value="billing">Plan, invoices, and payment method.</Tabs.Panel>
    </Tabs.Root>
  );
}
