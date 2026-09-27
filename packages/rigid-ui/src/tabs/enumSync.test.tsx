import { screen } from "@testing-library/dom";
import { describe, expect, it } from "vite-plus/test";
import { flushMicrotasks, render } from "../../test/test-utils";
import { Tabs } from "./index";
import { tabsStateAttributesMapping } from "./root/stateAttributesMapping";
import { TabsRootDataAttributes } from "./root/TabsRootDataAttributes";
import { TabsPanelDataAttributes } from "./panel/TabsPanelDataAttributes";
import { TabsListDataAttributes } from "./list/TabsListDataAttributes";
import { TabsTabDataAttributes } from "./tab/TabsTabDataAttributes";
import { TabsIndicatorDataAttributes } from "./indicator/TabsIndicatorDataAttributes";
import { TabsIndicatorCssVars } from "./indicator/TabsIndicatorCssVars";

// The parts inline these enums' values rather than referencing the members, so these tests
// re-link every inlined member and a rename on only one side fails.
describe("Tabs enum sync", () => {
  it("names the activation-direction attribute per TabsRootDataAttributes", () => {
    const emitted = tabsStateAttributesMapping.tabActivationDirection!("none");
    expect(Object.keys(emitted!)[0]).toBe(TabsRootDataAttributes.activationDirection);
  });

  it("names the panel index attribute per TabsPanelDataAttributes", async () => {
    render(() => (
      <Tabs.Root defaultValue={0}>
        <Tabs.List>
          <Tabs.Tab value={0} />
        </Tabs.List>
        <Tabs.Panel value={0} data-testid="panel" />
      </Tabs.Root>
    ));
    await flushMicrotasks();

    expect(screen.getByTestId("panel")).toHaveAttribute(TabsPanelDataAttributes.index);
  });

  it("names the tab attributes per TabsTabDataAttributes", async () => {
    render(() => (
      <Tabs.Root defaultValue={0} orientation="vertical">
        <Tabs.List>
          <Tabs.Tab value={0} data-testid="active-tab" />
          <Tabs.Tab value={1} disabled data-testid="disabled-tab" />
        </Tabs.List>
      </Tabs.Root>
    ));
    await flushMicrotasks();

    const activeTab = screen.getByTestId("active-tab");
    expect(activeTab).toHaveAttribute(TabsTabDataAttributes.orientation, "vertical");
    expect(activeTab).toHaveAttribute(TabsTabDataAttributes.activationDirection, "none");
    expect(activeTab).toHaveAttribute(TabsTabDataAttributes.active);
    expect(activeTab).not.toHaveAttribute(TabsTabDataAttributes.disabled);

    const disabledTab = screen.getByTestId("disabled-tab");
    expect(disabledTab).toHaveAttribute(TabsTabDataAttributes.disabled);
    expect(disabledTab).not.toHaveAttribute(TabsTabDataAttributes.active);
  });

  it("names the list and indicator attributes per their data attribute enums", async () => {
    render(() => (
      <Tabs.Root defaultValue={0} orientation="vertical">
        <Tabs.List data-testid="list">
          <Tabs.Tab value={0} />
          <Tabs.Indicator data-testid="indicator" />
        </Tabs.List>
      </Tabs.Root>
    ));
    await flushMicrotasks();

    const list = screen.getByTestId("list");
    expect(list).toHaveAttribute(TabsListDataAttributes.orientation, "vertical");
    expect(list).toHaveAttribute(TabsListDataAttributes.activationDirection, "none");

    const indicator = screen.getByTestId("indicator");
    expect(indicator).toHaveAttribute(TabsIndicatorDataAttributes.orientation, "vertical");
    expect(indicator).toHaveAttribute(TabsIndicatorDataAttributes.activationDirection, "none");
  });

  it("names the indicator CSS variables per TabsIndicatorCssVars", async () => {
    render(() => (
      <Tabs.Root defaultValue={0}>
        <Tabs.List>
          <Tabs.Tab value={0} />
          <Tabs.Indicator data-testid="indicator" />
        </Tabs.List>
      </Tabs.Root>
    ));
    await flushMicrotasks();

    // Every variable is written whenever a tab is selected, even without layout measurement.
    const indicator = screen.getByTestId("indicator");
    for (const cssVar of Object.values(TabsIndicatorCssVars)) {
      expect(indicator.style.getPropertyValue(cssVar)).not.toBe("");
    }
  });
});
