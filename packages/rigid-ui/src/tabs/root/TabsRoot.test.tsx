import { createEffect, createSignal, For, Show } from "solid-js";
import { fireEvent, screen, waitFor, within } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { flushMicrotasks, isJSDOM, render } from "../../../test/test-utils";
import { DirectionProvider } from "../../direction-provider";
import { Popover } from "../../popover";
import { Dialog } from "../../dialog";
import { Tabs } from "../index";

describe("<Tabs.Root />", () => {
  it("forwards props, class, style, and ref", () => {
    let ref: HTMLDivElement | undefined;
    render(() => (
      <Tabs.Root
        value={0}
        data-testid="root"
        class="root"
        style={{ color: "red" }}
        ref={(element) => {
          ref = element;
        }}
      />
    ));
    const root = screen.getByTestId("root");
    expect(root.tagName).toBe("DIV");
    expect(root).toHaveClass("root");
    expect(root.style.color).toBe("red");
    expect(ref).toBe(root);
    expect(root).toHaveAttribute("data-orientation", "horizontal");
    expect(root).toHaveAttribute("data-activation-direction", "none");
    expect(root).not.toHaveAttribute("value");
  });

  describe("prop: children", () => {
    it("should accept a null child", () => {
      render(() => (
        <Tabs.Root value={0}>
          {null}
          <Tabs.List>
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs.Root>
      ));

      expect(screen.getAllByRole("tab")).toHaveLength(1);
    });

    it("should support empty children", () => {
      render(() => <Tabs.Root value={1} />);
    });

    it("puts the selected child in tab order", async () => {
      const [value, setValue] = createSignal(1);
      render(() => (
        <Tabs.Root value={value()}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      expect(screen.getAllByRole("tab").map((tab) => tab.tabIndex)).toEqual([-1, 0]);

      setValue(0);
      await flushMicrotasks();

      expect(screen.getAllByRole("tab").map((tab) => tab.tabIndex)).toEqual([0, -1]);
    });

    it("sets the aria-labelledby attribute on tab panels to the corresponding tab id", async () => {
      render(() => (
        <Tabs.Root defaultValue="tab-0">
          <Tabs.List>
            <Tabs.Tab value="tab-0" />
            <Tabs.Tab value="tab-1" id="explicit-tab-id-1" />
            <Tabs.Tab value="tab-2" />
            <Tabs.Tab value="tab-3" id="explicit-tab-id-3" />
          </Tabs.List>
          <Tabs.Panel value="tab-1" keepMounted />
          <Tabs.Panel value="tab-0" keepMounted />
          <Tabs.Panel value="tab-2" keepMounted />
          <Tabs.Panel value="tab-3" keepMounted />
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const tabs = screen.getAllByRole("tab");
      const tabPanels = screen.getAllByRole("tabpanel", { hidden: true });

      expect(tabPanels[0]).toHaveAttribute("aria-labelledby", tabs[1].id);
      expect(tabPanels[1]).toHaveAttribute("aria-labelledby", tabs[0].id);
      expect(tabPanels[2]).toHaveAttribute("aria-labelledby", tabs[2].id);
      expect(tabPanels[3]).toHaveAttribute("aria-labelledby", tabs[3].id);
      expect(tabs[1].id).toBe("explicit-tab-id-1");
    });

    it("sets the aria-controls attribute on tabs to the corresponding tab panel id", async () => {
      render(() => (
        <Tabs.Root defaultValue="tab-0">
          <Tabs.List>
            <Tabs.Tab value="tab-0" />
            <Tabs.Tab value="tab-1" id="explicit-tab-id-1" />
            <Tabs.Tab value="tab-2" />
            <Tabs.Tab value="tab-3" id="explicit-tab-id-3" />
          </Tabs.List>
          <Tabs.Panel value="tab-1" keepMounted />
          <Tabs.Panel value="tab-0" keepMounted />
          <Tabs.Panel value="tab-2" keepMounted />
          <Tabs.Panel value="tab-3" keepMounted />
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const tabs = screen.getAllByRole("tab");
      const tabPanels = screen.getAllByRole("tabpanel", { hidden: true });

      expect(tabs[0]).toHaveAttribute("aria-controls", tabPanels[1].id);
      expect(tabs[1]).toHaveAttribute("aria-controls", tabPanels[0].id);
      expect(tabs[2]).toHaveAttribute("aria-controls", tabPanels[2].id);
      expect(tabs[3]).toHaveAttribute("aria-controls", tabPanels[3].id);
    });

    it("sets aria-controls on the first tab when no value is provided", async () => {
      render(() => (
        <Tabs.Root>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
          <Tabs.Panel value={0} keepMounted />
          <Tabs.Panel value={1} keepMounted />
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const tabs = screen.getAllByRole("tab");
      const tabPanels = screen.getAllByRole("tabpanel", { hidden: true });

      expect(tabs[0]).toHaveAttribute("aria-controls", tabPanels[0].id);
      expect(tabs[1]).toHaveAttribute("aria-controls", tabPanels[1].id);
      expect(tabPanels[0]).toHaveAttribute("aria-labelledby", tabs[0].id);
      expect(tabPanels[1]).toHaveAttribute("aria-labelledby", tabs[1].id);
    });

    it("syncs aria-controls to the mounted tab panel when keepMounted is false", async () => {
      render(() => (
        <Tabs.Root defaultValue="tab-0">
          <Tabs.List>
            <Tabs.Tab value="tab-0">Tab 0</Tabs.Tab>
            <Tabs.Tab value="tab-1">Tab 1</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="tab-0">Panel 0</Tabs.Panel>
          <Tabs.Panel value="tab-1">Panel 1</Tabs.Panel>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const tabs = screen.getAllByRole("tab");
      const [firstTabPanel] = screen.getAllByRole("tabpanel");

      expect(tabs[0]).toHaveAttribute("aria-controls", firstTabPanel.id);
      expect(tabs[1]).not.toHaveAttribute("aria-controls");

      fireEvent.click(tabs[1]);

      await waitFor(() => {
        const [secondTabPanel] = screen.getAllByRole("tabpanel");

        expect(secondTabPanel).toHaveTextContent("Panel 1");
        expect(tabs[0]).not.toHaveAttribute("aria-controls");
        expect(tabs[1]).toHaveAttribute("aria-controls", secondTabPanel.id);
      });
    });

    it("cleans and replaces panel registrations", async () => {
      const [panel, setPanel] = createSignal({ id: "panel-a", mounted: true, value: "a" });
      render(() => (
        <Tabs.Root value="a">
          <Tabs.List>
            <Tabs.Tab value="a">A</Tabs.Tab>
            <Tabs.Tab value="b">B</Tabs.Tab>
          </Tabs.List>
          <Show when={panel().mounted ? panel() : undefined} keyed>
            {(current) => <Tabs.Panel value={current.value} keepMounted />}
          </Show>
        </Tabs.Root>
      ));
      await flushMicrotasks();
      const [tabA, tabB] = screen.getAllByRole("tab");

      expect(tabA).toHaveAttribute(
        "aria-controls",
        screen.getByRole("tabpanel", { hidden: true }).id,
      );
      expect(tabB).not.toHaveAttribute("aria-controls");

      setPanel({ id: "panel-b", mounted: true, value: "b" });
      await flushMicrotasks();
      expect(tabA).not.toHaveAttribute("aria-controls");
      expect(tabB).toHaveAttribute(
        "aria-controls",
        screen.getByRole("tabpanel", { hidden: true }).id,
      );

      setPanel((current) => ({ ...current, mounted: false }));
      await flushMicrotasks();
      expect(tabA).not.toHaveAttribute("aria-controls");
      expect(tabB).not.toHaveAttribute("aria-controls");

      setPanel({ id: "panel-c", mounted: true, value: "b" });
      await flushMicrotasks();
      expect(tabA).not.toHaveAttribute("aria-controls");
      expect(tabB).toHaveAttribute(
        "aria-controls",
        screen.getByRole("tabpanel", { hidden: true }).id,
      );
    });
  });

  describe("prop: value", () => {
    it("should pass selected prop to children", () => {
      render(() => (
        <Tabs.Root value={1}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs.Root>
      ));

      const tabElements = screen.getAllByRole("tab");
      expect(tabElements[0]).toHaveAttribute("aria-selected", "false");
      expect(tabElements[1]).toHaveAttribute("aria-selected", "true");
    });

    it("should support values of different types", async () => {
      const tabValues = [0, "1", { value: 2 }, () => 3, Symbol("4"), /5/];

      render(() => (
        <Tabs.Root>
          <Tabs.List>
            <For each={tabValues}>{(value) => <Tabs.Tab value={value} />}</For>
          </Tabs.List>
          <For each={tabValues}>{(value) => <Tabs.Panel value={value} keepMounted />}</For>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const tabElements = screen.getAllByRole("tab");
      const tabPanelElements = screen.getAllByRole("tabpanel", { hidden: true });

      for (let index = 0; index < tabValues.length; index += 1) {
        expect(tabPanelElements[index]).toHaveAttribute("aria-labelledby", tabElements[index].id);
        tabElements[index].click();
        await flushMicrotasks();
        expect(tabPanelElements[index]).not.toHaveAttribute("hidden");
      }
    });
  });

  describe("disabled tabs", () => {
    it("should select the second tab when the first one is disabled", async () => {
      render(() => (
        <Tabs.Root>
          <Tabs.List>
            <Tabs.Tab value={0} disabled>
              Disabled tab
            </Tabs.Tab>
            <Tabs.Tab value={1}>Enabled tab</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value={0} keepMounted>
            Disabled panel
          </Tabs.Panel>
          <Tabs.Panel value={1} keepMounted>
            Enabled panel
          </Tabs.Panel>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const [disabledTab, enabledTab] = screen.getAllByRole("tab");
      const [disabledPanel, enabledPanel] = screen.getAllByRole("tabpanel", { hidden: true });

      expect(disabledTab).toHaveAttribute("aria-selected", "false");
      expect(enabledTab).toHaveAttribute("aria-selected", "true");
      // The implicit default was open for a frame before the fallback, so it closes like any
      // other panel.
      await waitFor(() => expect(disabledPanel).toHaveAttribute("hidden"));
      expect(enabledPanel).not.toHaveAttribute("hidden");
      expect(enabledPanel).toHaveTextContent("Enabled panel");
    });

    it("should select the third tab when first two tabs are disabled", async () => {
      render(() => (
        <Tabs.Root>
          <Tabs.List>
            <Tabs.Tab value={0} disabled>
              Tab 0
            </Tabs.Tab>
            <Tabs.Tab value={1} disabled>
              Tab 1
            </Tabs.Tab>
            <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
            <Tabs.Tab value={3}>Tab 3</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value={0}>Panel 0</Tabs.Panel>
          <Tabs.Panel value={1}>Panel 1</Tabs.Panel>
          <Tabs.Panel value={2}>Panel 2</Tabs.Panel>
          <Tabs.Panel value={3}>Panel 3</Tabs.Panel>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const tabs = screen.getAllByRole("tab");

      expect(tabs[2]).toHaveAttribute("aria-selected", "true");
      expect(tabs[0]).toHaveAttribute("aria-selected", "false");
      expect(tabs[1]).toHaveAttribute("aria-selected", "false");
      expect(tabs[3]).toHaveAttribute("aria-selected", "false");
    });

    it("should still honor explicit defaultValue even if it points to a disabled tab", async () => {
      render(() => (
        <Tabs.Root defaultValue={0}>
          <Tabs.List>
            <Tabs.Tab value={0} disabled>
              Tab 0
            </Tabs.Tab>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value={0}>Panel 0</Tabs.Panel>
          <Tabs.Panel value={1}>Panel 1</Tabs.Panel>
          <Tabs.Panel value={2}>Panel 2</Tabs.Panel>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const tabs = screen.getAllByRole("tab");

      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
      expect(tabs[1]).toHaveAttribute("aria-selected", "false");
      expect(tabs[2]).toHaveAttribute("aria-selected", "false");
    });

    it("continues honoring an initially disabled explicit defaultValue after defaultValue changes", async () => {
      const [defaultValue, setDefaultValue] = createSignal(0);
      render(() => (
        <Tabs.Root defaultValue={defaultValue()}>
          <Tabs.List>
            <Tabs.Tab value={0} disabled>
              Tab 0
            </Tabs.Tab>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");

      setDefaultValue(1);
      await flushMicrotasks();

      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
      expect(tabs[1]).toHaveAttribute("aria-selected", "false");
      expect(tabs[2]).toHaveAttribute("aria-selected", "false");
    });

    it("should still honor explicit value prop even if it points to a disabled tab", async () => {
      render(() => (
        <Tabs.Root value={0}>
          <Tabs.List>
            <Tabs.Tab value={0} disabled>
              Tab 0
            </Tabs.Tab>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value={0}>Panel 0</Tabs.Panel>
          <Tabs.Panel value={1}>Panel 1</Tabs.Panel>
          <Tabs.Panel value={2}>Panel 2</Tabs.Panel>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const tabs = screen.getAllByRole("tab");

      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
      expect(tabs[1]).toHaveAttribute("aria-selected", "false");
      expect(tabs[2]).toHaveAttribute("aria-selected", "false");
    });

    it("does not set tabIndex=0 on disabled tabs when they are programmatically selected", async () => {
      const [value, setValue] = createSignal(1);
      render(() => (
        <Tabs.Root value={value()}>
          <Tabs.List>
            <Tabs.Tab value={0} disabled>
              Tab 0
            </Tabs.Tab>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value={0}>Panel 0</Tabs.Panel>
          <Tabs.Panel value={1}>Panel 1</Tabs.Panel>
          <Tabs.Panel value={2}>Panel 2</Tabs.Panel>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const tabs = screen.getAllByRole("tab");

      expect(tabs[1]).toHaveAttribute("tabindex", "0");
      expect(tabs[0]).toHaveAttribute("tabindex", "-1");
      expect(tabs[2]).toHaveAttribute("tabindex", "-1");

      setValue(0);
      await flushMicrotasks();

      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
      expect(tabs[0]).toHaveAttribute("tabindex", "-1");
      expect(tabs[1]).toHaveAttribute("tabindex", "0");
    });

    it("does not select any tab when all tabs are disabled", async () => {
      render(() => (
        <Tabs.Root>
          <Tabs.List>
            <Tabs.Tab value={0} disabled>
              Tab 0
            </Tabs.Tab>
            <Tabs.Tab value={1} disabled>
              Tab 1
            </Tabs.Tab>
            <Tabs.Tab value={2} disabled>
              Tab 2
            </Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value={0} keepMounted>
            Panel 0
          </Tabs.Panel>
          <Tabs.Panel value={1} keepMounted>
            Panel 1
          </Tabs.Panel>
          <Tabs.Panel value={2} keepMounted>
            Panel 2
          </Tabs.Panel>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const tabs = screen.getAllByRole("tab");
      const panels = screen.getAllByRole("tabpanel", { hidden: true });

      for (const tab of tabs) expect(tab).toHaveAttribute("aria-selected", "false");
      await waitFor(() => {
        for (const panel of panels) expect(panel).toHaveAttribute("hidden");
      });
    });
  });

  describe("prop: onValueChange", () => {
    it("when `activateOnFocus = true` should call onValueChange on pointerdown", async () => {
      const handleChange = vi.fn();
      const handlePointerDown = vi.fn();
      render(() => (
        <Tabs.Root value={0} onValueChange={handleChange}>
          <Tabs.List activateOnFocus>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} onPointerDown={handlePointerDown} />
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const tab = screen.getAllByRole("tab")[1];
      fireEvent.pointerDown(tab, { button: 0 });
      fireEvent.mouseDown(tab, { button: 0 });
      tab.focus();
      expect(handleChange.mock.calls.length).toBe(1);
      expect(handlePointerDown.mock.calls.length).toBe(1);
      fireEvent.pointerUp(tab, { button: 0 });
    });

    it("should call onValueChange when clicking", async () => {
      const handleChange = vi.fn();
      render(() => (
        <Tabs.Root value={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      fireEvent.click(screen.getAllByRole("tab")[1]);
      expect(handleChange.mock.calls.length).toBe(1);
      expect(handleChange.mock.calls[0][0]).toBe(1);
    });

    it("should not call onValueChange on non-main button clicks", async () => {
      const handleChange = vi.fn();
      render(() => (
        <Tabs.Root value={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      fireEvent.click(screen.getAllByRole("tab")[1], { button: 2 });
      expect(handleChange.mock.calls.length).toBe(0);
    });

    it("should not call onValueChange when already active", async () => {
      const handleChange = vi.fn();
      render(() => (
        <Tabs.Root value={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      fireEvent.click(screen.getAllByRole("tab")[0]);
      expect(handleChange.mock.calls.length).toBe(0);
    });

    it("when `activateOnFocus = true` should call onValueChange if an unactive tab gets focused", async () => {
      const handleChange = vi.fn();
      render(() => (
        <Tabs.Root value={0} onValueChange={handleChange}>
          <Tabs.List activateOnFocus>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const [firstTab] = screen.getAllByRole("tab");
      firstTab.focus();

      fireEvent.keyDown(firstTab, { key: "ArrowRight" });
      await flushMicrotasks();

      expect(handleChange.mock.calls.length).toBe(1);
      expect(handleChange.mock.calls[0][0]).toBe(1);
    });

    it("when `activateOnFocus = false` should not call onValueChange if an unactive tab gets focused", async () => {
      const handleChange = vi.fn();
      render(() => (
        <Tabs.Root value={1} onValueChange={handleChange}>
          <Tabs.List activateOnFocus={false}>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      screen.getAllByRole("tab")[0].focus();
      await flushMicrotasks();

      expect(handleChange.mock.calls.length).toBe(0);
    });

    it("calls onValueChange when auto-selecting the first tab on mount", async () => {
      const handleChange = vi.fn();
      render(() => (
        <Tabs.Root onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0}>Tab 0</Tabs.Tab>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      expect(handleChange.mock.calls.length).toBe(1);
      expect(handleChange.mock.calls[0][0]).toBe(0);
      expect(handleChange.mock.calls[0][1].reason).toBe("initial");
      expect(handleChange.mock.calls[0][1].activationDirection).toBe("none");
      expect(screen.getAllByRole("tab")[0]).toHaveAttribute("aria-selected", "true");
    });

    it("calls onValueChange with the selected value when the implicit default matches a later tab", async () => {
      const handleChange = vi.fn();
      render(() => (
        <Tabs.Root onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            <Tabs.Tab value={0}>Tab 0</Tabs.Tab>
            <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      expect(handleChange.mock.calls.length).toBe(1);
      expect(handleChange.mock.calls[0][0]).toBe(0);
      expect(handleChange.mock.calls[0][1].reason).toBe("initial");

      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveAttribute("aria-selected", "false");
      expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    });

    it("calls onValueChange when the implicit first tab is disabled", async () => {
      const handleChange = vi.fn();
      render(() => (
        <Tabs.Root onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0} disabled>
              Tab 0
            </Tabs.Tab>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      expect(handleChange.mock.calls.length).toBe(1);
      expect(handleChange.mock.calls[0][0]).toBe(1);
      expect(handleChange.mock.calls[0][1].reason).toBe("initial");
      expect(handleChange.mock.calls[0][1].activationDirection).toBe("none");
      expect(screen.getAllByRole("tab")[1]).toHaveAttribute("aria-selected", "true");
    });

    it("does not cancel automatic value changes", async () => {
      const handleChange = vi.fn(
        (_value: Tabs.Tab.Value, eventDetails: Tabs.Root.ChangeEventDetails) => {
          eventDetails.cancel();
        },
      );
      render(() => (
        <Tabs.Root onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0} disabled>
              Tab 0
            </Tabs.Tab>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      expect(handleChange.mock.calls.length).toBe(1);
      const [value, details] = handleChange.mock.calls[0];
      expect(value).toBe(1);
      expect(details.reason).toBe("initial");
      expect(details.event).toBeInstanceOf(Event);
      expect(details.event.type).toBe("base-ui");
      expect(details.trigger).toBe(undefined);
      expect(details.activationDirection).toBe("none");

      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveAttribute("aria-selected", "false");
      expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    });

    it("does not move an uncontrolled selection when a user-initiated change is canceled", async () => {
      const handleChange = vi.fn(
        (_value: Tabs.Tab.Value, eventDetails: Tabs.Root.ChangeEventDetails) => {
          if (eventDetails.reason === "none") {
            eventDetails.cancel();
          }
        },
      );
      render(() => (
        <Tabs.Root defaultValue={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0}>Tab 0</Tabs.Tab>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");

      fireEvent.click(tabs[1]);
      await flushMicrotasks();

      expect(handleChange).toHaveBeenCalledTimes(1);
      expect(handleChange.mock.calls[0][1].reason).toBe("none");
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
      expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    });

    it("calls onValueChange with null when all tabs are initially disabled", async () => {
      const handleChange = vi.fn();
      render(() => (
        <Tabs.Root onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0} disabled>
              Tab 0
            </Tabs.Tab>
            <Tabs.Tab value={1} disabled>
              Tab 1
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      expect(handleChange.mock.calls.length).toBe(1);
      expect(handleChange.mock.calls[0][0]).toBe(null);
      expect(handleChange.mock.calls[0][1].reason).toBe("initial");
      expect(handleChange.mock.calls[0][1].activationDirection).toBe("none");

      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveAttribute("aria-selected", "false");
      expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    });

    it("does not emit missing when an enabled tab appears after all tabs were disabled", async () => {
      const handleChange = vi.fn();
      const [enableSecond, setEnableSecond] = createSignal(false);
      render(() => (
        <Tabs.Root onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0} disabled>
              Tab 0
            </Tabs.Tab>
            <Tabs.Tab value={1} disabled={!enableSecond()}>
              Tab 1
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      expect(handleChange.mock.calls.length).toBe(1);
      expect(handleChange.mock.calls[0][0]).toBe(null);
      expect(handleChange.mock.calls[0][1].reason).toBe("initial");

      setEnableSecond(true);
      await flushMicrotasks();

      expect(handleChange.mock.calls.length).toBe(1);
      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveAttribute("aria-selected", "false");
      expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    });

    it("does not call onValueChange on initial render when defaultValue is provided", async () => {
      const handleChange = vi.fn();
      render(() => (
        <Tabs.Root defaultValue={1} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0}>Tab 0</Tabs.Tab>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      expect(handleChange.mock.calls.length).toBe(0);
      expect(screen.getAllByRole("tab")[1]).toHaveAttribute("aria-selected", "true");
    });

    it("does not call onValueChange on initial render when defaultValue is null", async () => {
      const handleChange = vi.fn();
      render(() => (
        <Tabs.Root defaultValue={null} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0}>Tab 0</Tabs.Tab>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      expect(handleChange.mock.calls.length).toBe(0);
      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveAttribute("aria-selected", "false");
      expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    });

    it("treats defaultValue={undefined} as an implicit default when the first tab is disabled", async () => {
      const handleChange = vi.fn();
      render(() => (
        <Tabs.Root defaultValue={undefined} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0} disabled>
              Tab 0
            </Tabs.Tab>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      expect(handleChange.mock.calls.length).toBe(1);
      expect(handleChange.mock.calls[0][0]).toBe(1);
      expect(handleChange.mock.calls[0][1].reason).toBe("initial");
      expect(handleChange.mock.calls[0][1].activationDirection).toBe("none");

      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveAttribute("aria-selected", "false");
      expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    });

    it("calls onValueChange when the selected tab becomes disabled", async () => {
      const handleChange = vi.fn();
      const [disableFirst, setDisableFirst] = createSignal(false);
      render(() => (
        <Tabs.Root defaultValue={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0} disabled={disableFirst()}>
              Tab 0
            </Tabs.Tab>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      setDisableFirst(true);

      await waitFor(() => {
        expect(handleChange.mock.calls.length).toBe(1);
        expect(handleChange.mock.calls[0][0]).toBe(1);
        expect(handleChange.mock.calls[0][1].reason).toBe("disabled");
        expect(handleChange.mock.calls[0][1].activationDirection).toBe("none");
      });

      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveAttribute("aria-selected", "false");
      expect(tabs[1]).toHaveAttribute("aria-selected", "true");
    });

    it("calls onValueChange when an explicit disabled default becomes disabled again", async () => {
      const handleChange = vi.fn();
      const [disableFirst, setDisableFirst] = createSignal(true);
      render(() => (
        <Tabs.Root defaultValue={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0} disabled={disableFirst()}>
              Tab 0
            </Tabs.Tab>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      expect(handleChange.mock.calls.length).toBe(0);
      expect(screen.getAllByRole("tab")[0]).toHaveAttribute("aria-selected", "true");

      setDisableFirst(false);
      await flushMicrotasks();

      expect(handleChange.mock.calls.length).toBe(0);
      expect(screen.getAllByRole("tab")[0]).toHaveAttribute("aria-selected", "true");

      setDisableFirst(true);

      await waitFor(() => {
        expect(handleChange.mock.calls.length).toBe(1);
        expect(handleChange.mock.calls[0][0]).toBe(1);
        expect(handleChange.mock.calls[0][1].reason).toBe("disabled");
      });
      expect(screen.getAllByRole("tab")[1]).toHaveAttribute("aria-selected", "true");
    });

    it("calls onValueChange when the selected tab becomes disabled with keepMounted panels", async () => {
      const handleChange = vi.fn();
      const [disableFirst, setDisableFirst] = createSignal(false);
      render(() => (
        <Tabs.Root defaultValue={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0} disabled={disableFirst()}>
              Tab 0
            </Tabs.Tab>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value={0} keepMounted>
            Panel 0
          </Tabs.Panel>
          <Tabs.Panel value={1} keepMounted>
            Panel 1
          </Tabs.Panel>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      setDisableFirst(true);

      await waitFor(() => {
        expect(handleChange.mock.calls.length).toBe(1);
        expect(handleChange.mock.calls[0][0]).toBe(1);
        expect(handleChange.mock.calls[0][1].reason).toBe("disabled");
      });

      await waitFor(() => {
        const panels = screen.getAllByRole("tabpanel", { hidden: true });
        expect(panels[0]).toHaveAttribute("hidden");
        expect(panels[1]).not.toHaveAttribute("hidden");
      });
    });

    it("calls onValueChange when the selected tab is removed", async () => {
      const handleChange = vi.fn();
      const [showFirstTab, setShowFirstTab] = createSignal(true);
      render(() => (
        <Tabs.Root defaultValue={0} onValueChange={handleChange}>
          <Tabs.List>
            <Show when={showFirstTab()}>
              <Tabs.Tab value={0}>Tab 0</Tabs.Tab>
            </Show>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      setShowFirstTab(false);

      await waitFor(() => {
        expect(handleChange.mock.calls.length).toBe(1);
        expect(handleChange.mock.calls[0][0]).toBe(1);
        expect(handleChange.mock.calls[0][1].reason).toBe("missing");
      });

      await waitFor(() => {
        const tabs = screen.getAllByRole("tab");
        expect(tabs[0]).toHaveAttribute("aria-selected", "true");
        expect(tabs[0]).toHaveTextContent("Tab 1");
        expect(tabs[0]).toHaveAttribute("tabindex", "0");
      });
    });

    it("calls onValueChange with null when the selected tab is removed and no tabs remain", async () => {
      const handleChange = vi.fn();
      const [showTab, setShowTab] = createSignal(true);
      render(() => (
        <Tabs.Root defaultValue={0} onValueChange={handleChange}>
          <Tabs.List>
            <Show when={showTab()}>
              <Tabs.Tab value={0}>Tab 0</Tabs.Tab>
            </Show>
          </Tabs.List>
          <Tabs.Panel value={0} keepMounted>
            Panel 0
          </Tabs.Panel>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      expect(screen.getByRole("tabpanel")).not.toHaveAttribute("hidden");

      setShowTab(false);

      await waitFor(() => {
        expect(handleChange.mock.calls.length).toBe(1);
        expect(handleChange.mock.calls[0][0]).toBe(null);
        expect(handleChange.mock.calls[0][1].reason).toBe("missing");
      });

      expect(screen.queryAllByRole("tab").length).toBe(0);
      await waitFor(() => {
        expect(screen.getByRole("tabpanel", { hidden: true })).toHaveAttribute("hidden");
      });
    });

    it("calls onValueChange with null when a populated tab list is replaced by an empty one", async () => {
      const handleChange = vi.fn();
      const [empty, setEmpty] = createSignal(false);
      render(() => (
        <Tabs.Root defaultValue={0} onValueChange={handleChange}>
          <Show
            when={empty()}
            keyed
            fallback={
              <Tabs.List>
                <Tabs.Tab value={0}>Tab 0</Tabs.Tab>
              </Tabs.List>
            }
          >
            <Tabs.List />
          </Show>
          <Tabs.Panel value={0} keepMounted>
            Panel 0
          </Tabs.Panel>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      expect(screen.getByRole("tabpanel")).not.toHaveAttribute("hidden");

      setEmpty(true);

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith(
          null,
          expect.objectContaining({ reason: "missing" }),
        );
      });

      await waitFor(() => {
        const panel = screen.getByRole("tabpanel", { hidden: true });
        expect(panel).toHaveAttribute("hidden");
        expect(panel).not.toHaveAttribute("aria-labelledby");
      });
    });

    it("calls onValueChange when an explicit defaultValue points at a tab that is never present", async () => {
      const handleChange = vi.fn();
      render(() => (
        <Tabs.Root defaultValue={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));

      await waitFor(() => {
        expect(handleChange.mock.calls.length).toBe(1);
        expect(handleChange.mock.calls[0][0]).toBe(1);
        expect(handleChange.mock.calls[0][1].reason).toBe("missing");
      });

      await waitFor(() => {
        expect(screen.getAllByRole("tab")[0]).toHaveAttribute("aria-selected", "true");
      });
    });

    it("does not emit a second change when the fallback resolves to the current value", async () => {
      const handleValueChange = vi.fn();

      // Duplicate values are not supported; this only pins that the automatic fallback settles
      // instead of re-emitting.
      render(() => (
        <Tabs.Root onValueChange={handleValueChange}>
          <Tabs.List>
            <Tabs.Tab value="a" disabled>
              Stale duplicate
            </Tabs.Tab>
            <Tabs.Tab value="a">A</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();
      await flushMicrotasks();

      expect(handleValueChange).toHaveBeenCalledTimes(1);
      expect(handleValueChange.mock.calls[0][0]).toBe("a");
      expect(handleValueChange.mock.calls[0][1].reason).toBe("initial");
    });

    it("does not call onValueChange when a controlled selected tab becomes disabled", async () => {
      const handleChange = vi.fn();
      const [disableFirst, setDisableFirst] = createSignal(false);
      render(() => (
        <Tabs.Root value={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0} disabled={disableFirst()}>
              Tab 0
            </Tabs.Tab>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      setDisableFirst(true);
      await flushMicrotasks();

      expect(handleChange.mock.calls.length).toBe(0);
      const tabs = screen.getAllByRole("tab");
      expect(tabs[0]).toHaveAttribute("aria-selected", "true");
      expect(tabs[1]).toHaveAttribute("aria-selected", "false");
    });

    it("keeps a roving focus entry point when a controlled selected tab is removed", async () => {
      const handleChange = vi.fn();
      const [showLastTab, setShowLastTab] = createSignal(true);
      render(() => (
        <Tabs.Root value={2} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0}>Tab 0</Tabs.Tab>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            <Show when={showLastTab()}>
              <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
            </Show>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      setShowLastTab(false);
      await flushMicrotasks();

      expect(handleChange).not.toHaveBeenCalled();
      const [firstTab, secondTab] = screen.getAllByRole("tab");
      expect(firstTab).toHaveAttribute("aria-selected", "false");
      expect(secondTab).toHaveAttribute("aria-selected", "false");
      await waitFor(() => {
        expect([firstTab.tabIndex, secondTab.tabIndex]).toEqual([0, -1]);
      });

      firstTab.focus();
      fireEvent.keyDown(firstTab, { key: "ArrowRight" });
      await flushMicrotasks();

      expect(secondTab).toHaveFocus();
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe("prop: orientation", () => {
    it("does not add aria-orientation by default", () => {
      render(() => (
        <Tabs.Root value={0}>
          <Tabs.List />
        </Tabs.Root>
      ));

      expect(screen.getByRole("tablist")).not.toHaveAttribute("aria-orientation");
    });

    it("adds the proper aria-orientation when vertical", () => {
      render(() => (
        <Tabs.Root value={0} orientation="vertical">
          <Tabs.List />
        </Tabs.Root>
      ));

      expect(screen.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
    });
  });

  describe("pointer navigation", () => {
    function renderPointerTabs(disableSecond: boolean) {
      render(() => (
        <Tabs.Root defaultValue={0}>
          <Tabs.List activateOnFocus={false}>
            <Tabs.Tab value={0}>Tab 1</Tabs.Tab>
            <Tabs.Tab value={1} disabled={disableSecond}>
              Tab 2
            </Tabs.Tab>
            <Tabs.Tab value={2}>Tab 3</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value={0} keepMounted>
            Panel 1
          </Tabs.Panel>
          <Tabs.Panel value={1} keepMounted>
            Panel 2
          </Tabs.Panel>
          <Tabs.Panel value={2} keepMounted>
            Panel 3
          </Tabs.Panel>
        </Tabs.Root>
      ));
    }

    it("selects the clicked tab", async () => {
      renderPointerTabs(false);
      await flushMicrotasks();

      fireEvent.click(screen.getByRole("tab", { name: "Tab 2" }));

      await waitFor(() => {
        const panels = screen.getAllByRole("tabpanel", { hidden: true });
        expect(panels[0]).toHaveAttribute("hidden");
        expect(panels[1]).not.toHaveAttribute("hidden");
        expect(panels[2]).toHaveAttribute("hidden");
      });
    });

    it("does not select the clicked disabled tab", async () => {
      renderPointerTabs(true);
      await flushMicrotasks();

      fireEvent.click(screen.getByRole("tab", { name: "Tab 2" }));
      await flushMicrotasks();

      const panels = screen.getAllByRole("tabpanel", { hidden: true });
      expect(panels[0]).not.toHaveAttribute("hidden");
      expect(panels[1]).toHaveAttribute("hidden");
      expect(panels[2]).toHaveAttribute("hidden");
    });
  });

  describe("keyboard navigation when focus is on a tab", () => {
    const cases = [
      ["horizontal", "ltr", "ArrowLeft", "ArrowRight"],
      ["horizontal", "rtl", "ArrowRight", "ArrowLeft"],
      ["vertical", "ltr", "ArrowUp", "ArrowDown"],
    ] as const;

    for (const [orientation, direction, previousItemKey, nextItemKey] of cases) {
      describe(`when focus is on a tab element in a ${orientation} ${direction} tablist`, () => {
        function renderTabs(options: {
          value: number;
          activateOnFocus?: boolean;
          disabledIndex?: number;
        }) {
          const handleChange = vi.fn();
          const handleKeyDown = vi.fn();
          render(() => (
            <DirectionProvider direction={direction}>
              <Tabs.Root
                onValueChange={handleChange}
                orientation={orientation}
                value={options.value}
              >
                <Tabs.List
                  activateOnFocus={options.activateOnFocus ?? false}
                  onKeyDown={handleKeyDown}
                >
                  <Tabs.Tab value={0} disabled={options.disabledIndex === 0} />
                  <Tabs.Tab value={1} disabled={options.disabledIndex === 1} />
                  <Tabs.Tab value={2} disabled={options.disabledIndex === 2} />
                </Tabs.List>
              </Tabs.Root>
            </DirectionProvider>
          ));
          return { handleChange, handleKeyDown, tabs: screen.getAllByRole("tab") };
        }

        async function press(target: HTMLElement, key: string) {
          fireEvent.keyDown(target, { key });
          await flushMicrotasks();
        }

        for (const activateOnFocus of [false, true]) {
          describe(`${previousItemKey} with \`activateOnFocus = ${activateOnFocus}\``, () => {
            it("moves focus to the last tab if focus is on the first tab", async () => {
              const { handleChange, handleKeyDown, tabs } = renderTabs({
                value: 0,
                activateOnFocus,
              });
              await flushMicrotasks();
              tabs[0].focus();

              await press(tabs[0], previousItemKey);

              expect(tabs[2]).toHaveFocus();
              if (activateOnFocus) {
                expect(handleChange.mock.calls.length).toBe(1);
                expect(handleChange.mock.calls[0][0]).toBe(2);
              } else {
                expect(handleChange.mock.calls.length).toBe(0);
              }
              expect(handleKeyDown.mock.calls.length).toBe(1);
              expect(handleKeyDown.mock.calls[0][0]).toHaveProperty("defaultPrevented", true);
            });

            it("moves focus to the previous tab", async () => {
              const { handleChange, handleKeyDown, tabs } = renderTabs({
                value: 1,
                activateOnFocus,
              });
              await flushMicrotasks();
              tabs[1].focus();

              await press(tabs[1], previousItemKey);

              expect(tabs[0]).toHaveFocus();
              if (activateOnFocus) {
                expect(handleChange.mock.calls.length).toBe(1);
                expect(handleChange.mock.calls[0][0]).toBe(0);
              } else {
                expect(handleChange.mock.calls.length).toBe(0);
              }
              expect(handleKeyDown.mock.calls[0][0]).toHaveProperty("defaultPrevented", true);
            });

            it("moves focus to a disabled tab without activating it", async () => {
              const { handleChange, handleKeyDown, tabs } = renderTabs({
                value: 2,
                activateOnFocus,
                disabledIndex: 1,
              });
              await flushMicrotasks();
              tabs[2].focus();

              await press(tabs[2], previousItemKey);

              expect(tabs[1]).toHaveFocus();
              expect(handleChange.mock.calls.length).toBe(0);
              expect(handleKeyDown.mock.calls.length).toBe(1);
              expect(handleKeyDown.mock.calls[0][0]).toHaveProperty("defaultPrevented", true);
            });
          });

          describe(`${nextItemKey} with \`activateOnFocus = ${activateOnFocus}\``, () => {
            it("moves focus to the first tab if focus is on the last tab", async () => {
              const { handleChange, handleKeyDown, tabs } = renderTabs({
                value: 2,
                activateOnFocus,
              });
              await flushMicrotasks();
              tabs[2].focus();

              await press(tabs[2], nextItemKey);

              expect(tabs[0]).toHaveFocus();
              if (activateOnFocus) {
                expect(handleChange.mock.calls.length).toBe(1);
                expect(handleChange.mock.calls[0][0]).toBe(0);
              } else {
                expect(handleChange.mock.calls.length).toBe(0);
              }
              expect(handleKeyDown.mock.calls.length).toBe(1);
              expect(handleKeyDown.mock.calls[0][0]).toHaveProperty("defaultPrevented", true);
            });

            it("moves focus to the next tab", async () => {
              const { handleChange, handleKeyDown, tabs } = renderTabs({
                value: 1,
                activateOnFocus,
              });
              await flushMicrotasks();
              tabs[1].focus();

              await press(tabs[1], nextItemKey);

              expect(tabs[2]).toHaveFocus();
              if (activateOnFocus) {
                expect(handleChange.mock.calls.length).toBe(1);
                expect(handleChange.mock.calls[0][0]).toBe(2);
              } else {
                expect(handleChange.mock.calls.length).toBe(0);
              }
              expect(handleKeyDown.mock.calls[0][0]).toHaveProperty("defaultPrevented", true);
            });

            it("moves focus to a disabled tab without activating it, then past it", async () => {
              const { handleChange, handleKeyDown, tabs } = renderTabs({
                value: 0,
                activateOnFocus,
                disabledIndex: 1,
              });
              await flushMicrotasks();
              tabs[0].focus();

              await press(tabs[0], nextItemKey);

              expect(tabs[1]).toHaveFocus();
              expect(handleChange.mock.calls.length).toBe(0);
              expect(handleKeyDown.mock.calls[0][0]).toHaveProperty("defaultPrevented", true);

              await press(tabs[1], nextItemKey);
              expect(tabs[2]).toHaveFocus();
            });
          });
        }

        describe("modifier keys", () => {
          for (const modifierKey of ["shiftKey", "ctrlKey", "altKey", "metaKey"] as const) {
            it(`does not move focus when modifier key: ${modifierKey} is pressed`, async () => {
              const { handleChange, handleKeyDown, tabs } = renderTabs({
                value: 0,
                activateOnFocus: true,
              });
              await flushMicrotasks();
              tabs[0].focus();

              fireEvent.keyDown(tabs[0], { key: nextItemKey, [modifierKey]: true });
              await flushMicrotasks();
              expect(tabs[0]).toHaveFocus();

              fireEvent.keyDown(tabs[0], { key: previousItemKey, [modifierKey]: true });
              await flushMicrotasks();
              expect(tabs[0]).toHaveFocus();
              expect(handleChange.mock.calls.length).toBe(0);
              expect(handleKeyDown.mock.calls.length).toBe(2);
            });
          }
        });
      });
    }

    describe("when focus is on a tab regardless of orientation", () => {
      for (const [key, focusedIndex, targetIndex] of [
        ["Home", 2, 0],
        ["End", 0, 2],
      ] as const) {
        describe(key, () => {
          for (const activateOnFocus of [false, true]) {
            it(`when \`activateOnFocus = ${activateOnFocus}\`, moves focus to the ${key === "Home" ? "first" : "last"} tab`, async () => {
              const handleChange = vi.fn();
              const handleKeyDown = vi.fn();
              render(() => (
                <Tabs.Root onValueChange={handleChange} value={focusedIndex}>
                  <Tabs.List activateOnFocus={activateOnFocus} onKeyDown={handleKeyDown}>
                    <Tabs.Tab value={0} />
                    <Tabs.Tab value={1} />
                    <Tabs.Tab value={2} />
                  </Tabs.List>
                </Tabs.Root>
              ));
              await flushMicrotasks();
              const tabs = screen.getAllByRole("tab");
              tabs[focusedIndex].focus();

              fireEvent.keyDown(tabs[focusedIndex], { key });
              await flushMicrotasks();

              expect(tabs[targetIndex]).toHaveFocus();
              if (activateOnFocus) {
                expect(handleChange.mock.calls.length).toBe(1);
                expect(handleChange.mock.calls[0][0]).toBe(targetIndex);
              } else {
                expect(handleChange.mock.calls.length).toBe(0);
              }
              expect(handleKeyDown.mock.calls.length).toBe(1);
              expect(handleKeyDown.mock.calls[0][0]).toHaveProperty("defaultPrevented", true);
            });

            it(`when \`activateOnFocus = ${activateOnFocus}\`, moves focus to a disabled tab without activating it`, async () => {
              const handleChange = vi.fn();
              const handleKeyDown = vi.fn();
              render(() => (
                <Tabs.Root onValueChange={handleChange} value={focusedIndex}>
                  <Tabs.List activateOnFocus={activateOnFocus} onKeyDown={handleKeyDown}>
                    <Tabs.Tab value={0} disabled={targetIndex === 0} />
                    <Tabs.Tab value={1} />
                    <Tabs.Tab value={2} disabled={targetIndex === 2} />
                  </Tabs.List>
                </Tabs.Root>
              ));
              await flushMicrotasks();
              const tabs = screen.getAllByRole("tab");
              tabs[focusedIndex].focus();

              fireEvent.keyDown(tabs[focusedIndex], { key });
              await flushMicrotasks();

              expect(tabs[targetIndex]).toHaveFocus();
              expect(handleChange.mock.calls.length).toBe(0);
              expect(handleKeyDown.mock.calls.length).toBe(1);
              expect(handleKeyDown.mock.calls[0][0]).toHaveProperty("defaultPrevented", true);
            });
          }
        });
      }
    });

    it("should allow to focus first tab when there are no active tabs", async () => {
      render(() => (
        <Tabs.Root defaultValue={0}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      expect(screen.getAllByRole("tab").map((tab) => tab.getAttribute("tabindex"))).toEqual([
        "0",
        "-1",
      ]);
    });
  });

  describe.skipIf(isJSDOM)("activation direction", () => {
    function renderWithPanels(options: {
      orientation?: "horizontal" | "vertical";
      value?: () => number;
    }) {
      const panelStates: Array<{ value: number; tabActivationDirection: string }> = [];
      const style = options.orientation === "vertical" ? { display: "block" } : undefined;
      render(() => (
        <Tabs.Root data-testid="root" orientation={options.orientation} value={options.value?.()}>
          <Tabs.List>
            <Tabs.Tab value={0} style={style} />
            <Tabs.Tab value={1} style={style} />
          </Tabs.List>
          <For each={[0, 1]}>
            {(value) => (
              <Tabs.Panel
                value={value}
                render={(props, state) => {
                  // The state is live, so this logs every direction it passes through.
                  createEffect(
                    () => state.tabActivationDirection,
                    (tabActivationDirection) => {
                      panelStates.push({ value, tabActivationDirection });
                    },
                  );
                  return <div {...props} />;
                }}
              />
            )}
          </For>
        </Tabs.Root>
      ));
      return { root: screen.getByTestId("root"), tabs: screen.getAllByRole("tab"), panelStates };
    }

    function firstPanelState(
      panelStates: Array<{ value: number; tabActivationDirection: string }>,
      value: number,
    ) {
      return panelStates.find((state) => state.value === value);
    }

    for (const [orientation, forward, backward] of [
      ["horizontal", "right", "left"],
      ["vertical", "down", "up"],
    ] as const) {
      it(`should set the \`data-activation-direction\` attribute on the tabs root with orientation=${orientation}`, async () => {
        const { root, tabs, panelStates } = renderWithPanels({ orientation });
        await flushMicrotasks();
        panelStates.length = 0;

        expect(root).toHaveAttribute("data-activation-direction", "none");
        fireEvent.click(tabs[1]);
        await flushMicrotasks();

        expect(firstPanelState(panelStates, 1)).toEqual(
          expect.objectContaining({ value: 1, tabActivationDirection: forward }),
        );
        expect(root).toHaveAttribute("data-activation-direction", forward);

        await new Promise((resolve) => setTimeout(resolve, 50));
        panelStates.length = 0;

        fireEvent.click(tabs[0]);
        await flushMicrotasks();

        expect(firstPanelState(panelStates, 0)).toEqual(
          expect.objectContaining({ value: 0, tabActivationDirection: backward }),
        );
        expect(root).toHaveAttribute("data-activation-direction", backward);
      });

      it(`should update \`data-activation-direction\` on programmatic value changes with orientation=${orientation}`, async () => {
        const [value, setValue] = createSignal(0);
        const { root, tabs, panelStates } = renderWithPanels({ orientation, value });
        await flushMicrotasks();
        panelStates.length = 0;

        expect(root).toHaveAttribute("data-activation-direction", "none");
        expect(tabs[0]).toHaveAttribute("data-activation-direction", "none");

        setValue(1);
        await flushMicrotasks();

        expect(firstPanelState(panelStates, 1)).toEqual(
          expect.objectContaining({ value: 1, tabActivationDirection: forward }),
        );
        expect(root).toHaveAttribute("data-activation-direction", forward);
        expect(tabs[1]).toHaveAttribute("data-activation-direction", forward);

        panelStates.length = 0;
        setValue(0);
        await flushMicrotasks();

        expect(firstPanelState(panelStates, 0)).toEqual(
          expect.objectContaining({ value: 0, tabActivationDirection: backward }),
        );
        expect(root).toHaveAttribute("data-activation-direction", backward);
        expect(tabs[0]).toHaveAttribute("data-activation-direction", backward);
      });
    }

    it("should call onValueChange with the activation direction when clicking", async () => {
      const handleChange = vi.fn();
      render(() => (
        <Tabs.Root value={0} onValueChange={handleChange}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      fireEvent.click(screen.getAllByRole("tab")[1]);
      expect(handleChange.mock.calls.length).toBe(1);
      expect(handleChange.mock.calls[0][0]).toBe(1);
      expect(handleChange.mock.calls[0][1].activationDirection).toBe("right");
    });

    it("keeps activation direction none after automatic disabled fallback", async () => {
      const [disableFirst, setDisableFirst] = createSignal(false);
      render(() => (
        <Tabs.Root data-testid="root" defaultValue={0}>
          <Tabs.List>
            <Tabs.Tab value={0} disabled={disableFirst()}>
              Tab 0
            </Tabs.Tab>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value={0}>Panel 0</Tabs.Panel>
          <Tabs.Panel value={1}>Panel 1</Tabs.Panel>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      setDisableFirst(true);

      await waitFor(() => {
        expect(screen.getAllByRole("tab")[1]).toHaveAttribute("aria-selected", "true");
      });
      expect(screen.getByTestId("root")).toHaveAttribute("data-activation-direction", "none");
    });

    it("resets `data-activation-direction` when the selection is cleared and restored", async () => {
      const [value, setValue] = createSignal<number | null>(0);
      render(() => (
        <Tabs.Root data-testid="root" value={value()}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
            <Tabs.Indicator data-testid="indicator" />
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const root = screen.getByTestId("root");

      setValue(1);
      await flushMicrotasks();
      expect(root).toHaveAttribute("data-activation-direction", "right");

      // Clearing the selection is not a directional transition.
      setValue(null);
      await flushMicrotasks();
      expect(root).toHaveAttribute("data-activation-direction", "none");
      expect(screen.queryByTestId("indicator")).toBe(null);

      // Neither is selecting a tab again from a cleared state.
      setValue(0);
      await flushMicrotasks();
      expect(root).toHaveAttribute("data-activation-direction", "none");
      expect(screen.getByTestId("indicator")).not.toBe(null);
    });

    it("should update `data-activation-direction` on programmatic change after a canceled click", async () => {
      const [value, setValue] = createSignal(0);
      render(() => (
        <Tabs.Root
          data-testid="root"
          value={value()}
          onValueChange={(_value, eventDetails) => {
            eventDetails.cancel();
          }}
        >
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
          <Tabs.Panel value={0} />
          <Tabs.Panel value={1} />
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const root = screen.getByTestId("root");
      fireEvent.click(screen.getAllByRole("tab")[1]);
      await flushMicrotasks();
      expect(root).toHaveAttribute("data-activation-direction", "none");

      setValue(1);
      await flushMicrotasks();
      expect(root).toHaveAttribute("data-activation-direction", "right");
    });

    it("should update `data-activation-direction` on programmatic change after a controlled parent ignores click", async () => {
      const [value, setValue] = createSignal(0);
      render(() => (
        <Tabs.Root data-testid="root" value={value()} onValueChange={() => {}}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
          </Tabs.List>
          <Tabs.Panel value={0} />
          <Tabs.Panel value={1} />
        </Tabs.Root>
      ));
      await flushMicrotasks();

      fireEvent.click(screen.getAllByRole("tab")[1]);
      await flushMicrotasks();

      setValue(1);
      await flushMicrotasks();
      expect(screen.getByTestId("root")).toHaveAttribute("data-activation-direction", "right");
    });

    for (const [label, initialTabs, finalTabs, finalValue] of [
      ["numeric values", [0, 1], [0, 1, 2], 2],
      [
        "out of order string values",
        ["Overview", "Projects"],
        ["Overview", "Projects", "Account"],
        "Account",
      ],
    ] as const) {
      it(`should compute correct direction when adding and selecting a new tab in one controlled update with ${label}`, async () => {
        const panelDirections: string[] = [];
        const [tabs, setTabs] = createSignal<readonly (string | number)[]>(initialTabs);
        const [value, setValue] = createSignal<string | number>(initialTabs[0]);
        render(() => (
          <Tabs.Root data-testid="root" value={value()}>
            <Tabs.List>
              <For each={tabs()}>{(tab) => <Tabs.Tab value={tab} />}</For>
            </Tabs.List>
            <For each={tabs()}>
              {(tab) => (
                <Tabs.Panel
                  value={tab}
                  render={(props, state) => {
                    createEffect(
                      () => state.tabActivationDirection,
                      (direction) => {
                        panelDirections.push(direction);
                      },
                    );
                    return <div {...props} />;
                  }}
                />
              )}
            </For>
          </Tabs.Root>
        ));
        await flushMicrotasks();

        const root = screen.getByTestId("root");
        expect(root).toHaveAttribute("data-activation-direction", "none");

        setTabs(finalTabs);
        setValue(finalValue);
        await flushMicrotasks();

        await waitFor(() => {
          expect(root).toHaveAttribute("data-activation-direction", "right");
        });
        expect(panelDirections.at(-1)).toBe("right");
      });
    }
  });

  describe("nested tabs", () => {
    it("keeps a nested root independent from the one hosting its panel", async () => {
      render(() => (
        <Tabs.Root defaultValue="outer-1">
          <Tabs.List data-testid="outer-list">
            <Tabs.Tab value="outer-1">Outer 1</Tabs.Tab>
            <Tabs.Tab value="outer-2">Outer 2</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="outer-1" data-testid="outer-panel-1">
            <Tabs.Root defaultValue="inner-1">
              <Tabs.List data-testid="inner-list">
                <Tabs.Tab value="inner-1">Inner 1</Tabs.Tab>
                <Tabs.Tab value="inner-2">Inner 2</Tabs.Tab>
              </Tabs.List>
              <Tabs.Panel value="inner-1">Inner panel 1</Tabs.Panel>
              <Tabs.Panel value="inner-2">Inner panel 2</Tabs.Panel>
            </Tabs.Root>
          </Tabs.Panel>
          <Tabs.Panel value="outer-2">Outer panel 2</Tabs.Panel>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const [outerTab1, outerTab2] = within(screen.getByTestId("outer-list")).getAllByRole("tab");
      const [innerTab1, innerTab2] = within(screen.getByTestId("inner-list")).getAllByRole("tab");

      const outerPanel1 = screen.getByTestId("outer-panel-1");
      const innerPanel1 = screen.getByText("Inner panel 1");

      expect(outerTab1).toHaveAttribute("aria-controls", outerPanel1.id);
      expect(innerTab1).toHaveAttribute("aria-controls", innerPanel1.id);
      expect(innerPanel1).toHaveAttribute("aria-labelledby", innerTab1.id);

      // Arrow keys within the nested list stay within the nested list.
      innerTab1.focus();
      fireEvent.keyDown(innerTab1, { key: "ArrowRight" });
      await flushMicrotasks();

      expect(innerTab2).toHaveFocus();
      expect(innerTab2).toHaveAttribute("aria-selected", "false");

      // A native button activates on Enter with a click.
      innerTab2.click();
      await flushMicrotasks();

      expect(innerTab2).toHaveAttribute("aria-selected", "true");
      await waitFor(() => {
        expect(screen.getByText("Inner panel 2")).not.toHaveAttribute("hidden");
      });
      expect(outerTab1).toHaveAttribute("aria-selected", "true");
      expect(outerTab2).toHaveAttribute("aria-selected", "false");

      // Selecting an outer tab unmounts the nested root along with its panel.
      fireEvent.click(outerTab2);

      await waitFor(() => {
        expect(screen.queryByTestId("inner-list")).toBe(null);
      });
      expect(screen.getByText("Outer panel 2")).not.toHaveAttribute("hidden");
    });
  });

  describe("popups", () => {
    function renderTabsContent() {
      return (
        <Tabs.Root defaultValue="overview">
          <Tabs.List>
            <Tabs.Tab value="overview">Overview</Tabs.Tab>
            <Tabs.Tab value="projects">Projects</Tabs.Tab>
            <Tabs.Tab value="account">Account</Tabs.Tab>
          </Tabs.List>
          <Tabs.Panel value="overview" />
          <Tabs.Panel value="projects" />
          <Tabs.Panel value="account" />
        </Tabs.Root>
      );
    }

    async function expectArrowNavigation() {
      const tab1 = await screen.findByRole("tab", { name: "Overview" });
      await waitFor(() => {
        expect(tab1).toHaveFocus();
      });

      fireEvent.keyDown(tab1, { key: "ArrowRight" });

      const tab2 = screen.getByRole("tab", { name: "Projects" });
      await waitFor(() => {
        expect(tab2).toHaveFocus();
      });
    }

    it("works inside Popover", async () => {
      render(() => (
        <Popover.Root>
          <Popover.Trigger>Open</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner sideOffset={8}>
              <Popover.Popup>{renderTabsContent()}</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      fireEvent.click(screen.getByRole("button", { name: "Open" }));
      await expectArrowNavigation();
    });

    it("works inside Dialog", async () => {
      render(() => (
        <Dialog.Root>
          <Dialog.Trigger>Open</Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Popup>{renderTabsContent()}</Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      ));

      fireEvent.click(screen.getByRole("button", { name: "Open" }));
      await expectArrowNavigation();
    });
  });

  describe("highlight synchronization on external value change relative to focus", () => {
    it.each([true, false])(
      "keeps controlled async activation and focus aligned with activateOnFocus=%s",
      async (activateOnFocus) => {
        const onValueChange = vi.fn();
        const [value, setValue] = createSignal(0);
        render(() => (
          <Tabs.Root
            value={value()}
            onValueChange={(nextValue) => {
              onValueChange(nextValue);
              if (typeof nextValue === "number") {
                void Promise.resolve().then(() => setValue(nextValue));
              }
            }}
          >
            <Tabs.List activateOnFocus={activateOnFocus}>
              <Tabs.Tab value={0}>First</Tabs.Tab>
              <Tabs.Tab value={1} disabled>
                Disabled
              </Tabs.Tab>
              <Tabs.Tab value={2}>Third</Tabs.Tab>
            </Tabs.List>
          </Tabs.Root>
        ));
        await flushMicrotasks();
        const [firstTab, disabledTab, thirdTab] = screen.getAllByRole("tab");

        firstTab.focus();
        fireEvent.keyDown(firstTab, { key: "ArrowRight" });
        await flushMicrotasks();
        expect(disabledTab).toHaveFocus();
        expect(firstTab).toHaveAttribute("aria-selected", "true");

        fireEvent.keyDown(disabledTab, { key: "ArrowRight" });
        await flushMicrotasks();
        expect(thirdTab).toHaveFocus();

        if (!activateOnFocus) {
          expect(onValueChange).not.toHaveBeenCalled();
          thirdTab.click();
        }

        await waitFor(() => expect(thirdTab).toHaveAttribute("aria-selected", "true"));
        expect(thirdTab).toHaveFocus();
        expect(onValueChange).toHaveBeenCalledWith(2);
      },
    );

    it("when focus is outside the tablist, highlight follows the new active tab (tabIndex=0 moves)", async () => {
      const [value, setValue] = createSignal(0);
      render(() => (
        <Tabs.Root value={value()}>
          <Tabs.List activateOnFocus={false}>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
            <Tabs.Tab value={2} />
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const [firstTab, secondTab, thirdTab] = screen.getAllByRole("tab");
      expect(firstTab.tabIndex).toBe(0);

      setValue(2);
      await flushMicrotasks();

      expect(firstTab.tabIndex).toBe(-1);
      expect(secondTab.tabIndex).toBe(-1);
      expect(thirdTab.tabIndex).toBe(0);

      setValue(1);
      await flushMicrotasks();

      expect(firstTab.tabIndex).toBe(-1);
      expect(secondTab.tabIndex).toBe(0);
      expect(thirdTab.tabIndex).toBe(-1);
    });

    it("when focus is inside the tablist, highlight stays put on external change and arrow keys continue from the focused tab", async () => {
      const [value, setValue] = createSignal(0);
      render(() => (
        <Tabs.Root value={value()}>
          <Tabs.List activateOnFocus={false}>
            <Tabs.Tab value={0}>Tab 1</Tabs.Tab>
            <Tabs.Tab value={1}>Tab 2</Tabs.Tab>
            <Tabs.Tab value={2}>Tab 3</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const [firstTab, secondTab, thirdTab] = screen.getAllByRole("tab");

      firstTab.focus();
      await flushMicrotasks();
      expect(firstTab).toHaveProperty("tabIndex", 0);

      setValue(2);
      await flushMicrotasks();

      expect(firstTab.tabIndex).toBe(0);
      expect(secondTab.tabIndex).toBe(-1);
      expect(thirdTab.tabIndex).toBe(-1);
      expect(firstTab).toHaveAttribute("aria-selected", "false");
      expect(thirdTab).toHaveAttribute("aria-selected", "true");

      fireEvent.keyDown(firstTab, { key: "ArrowRight" });
      await flushMicrotasks();

      expect(secondTab).toHaveFocus();
      expect(thirdTab).toHaveAttribute("aria-selected", "true");
      expect(secondTab).toHaveAttribute("aria-selected", "false");
    });
  });
});
