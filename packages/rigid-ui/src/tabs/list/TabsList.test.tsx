import { createSignal, Errored, Show } from "solid-js";
import { fireEvent, screen } from "@testing-library/dom";
import { describe, expect, it } from "vite-plus/test";
import { flushMicrotasks, render } from "../../../test/test-utils";
import { Tabs } from "../index";

describe("<Tabs.List />", () => {
  it("forwards props, class, style, and ref", () => {
    let ref: HTMLDivElement | undefined;
    render(() => (
      <Tabs.Root value={0} orientation="vertical">
        <Tabs.List
          id="list"
          class="list"
          style={{ color: "red" }}
          ref={(element) => {
            ref = element;
          }}
        />
      </Tabs.Root>
    ));
    const list = screen.getByRole("tablist");
    expect(list.tagName).toBe("DIV");
    expect(list).toHaveAttribute("id", "list");
    expect(list).toHaveClass("list");
    expect(list.style.color).toBe("red");
    expect(ref).toBe(list);
    expect(list).toHaveAttribute("data-orientation", "vertical");
    expect(list).toHaveAttribute("data-activation-direction", "none");
  });

  it("throws a descriptive error when rendered outside <Tabs.Root>", () => {
    let caught: unknown;
    render(() => (
      <Errored
        fallback={(error) => {
          caught = error();
          return null;
        }}
      >
        <Tabs.List />
      </Errored>
    ));

    expect((caught as Error).message).toBe(
      "Rigid UI: TabsRootContext is missing. Tabs parts must be placed within <Tabs.Root>.",
    );
  });

  describe("accessibility attributes", () => {
    it("sets the aria-selected attribute on the active tab", async () => {
      render(() => (
        <Tabs.Root defaultValue={1}>
          <Tabs.List>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
            <Tabs.Tab value={3}>Tab 3</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const tabs = [
        screen.getByText("Tab 1"),
        screen.getByText("Tab 2"),
        screen.getByText("Tab 3"),
      ];
      const expectSelected = (index: number) =>
        tabs.forEach((tab, tabIndex) =>
          expect(tab).toHaveAttribute("aria-selected", String(tabIndex === index)),
        );

      expectSelected(0);
      for (const index of [1, 2, 0]) {
        tabs[index].click();
        await flushMicrotasks();
        expectSelected(index);
      }
    });
  });

  describe("prop: loopFocus", () => {
    it("does not wrap focus past the first tab when `loopFocus` is false", async () => {
      render(() => (
        <Tabs.Root value={0}>
          <Tabs.List loopFocus={false}>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
            <Tabs.Tab value={2} />
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const [firstTab, , lastTab] = screen.getAllByRole("tab");
      firstTab.focus();

      fireEvent.keyDown(firstTab, { key: "ArrowLeft" });
      await flushMicrotasks();

      expect(firstTab).toHaveFocus();
      expect(lastTab).not.toHaveFocus();
    });

    it("does not wrap focus past the last tab when `loopFocus` is false", async () => {
      render(() => (
        <Tabs.Root value={2}>
          <Tabs.List loopFocus={false}>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} />
            <Tabs.Tab value={2} />
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const [firstTab, , lastTab] = screen.getAllByRole("tab");
      lastTab.focus();

      fireEvent.keyDown(lastTab, { key: "ArrowRight" });
      await flushMicrotasks();

      expect(lastTab).toHaveFocus();
      expect(firstTab).not.toHaveFocus();
    });
  });

  describe("keyboard navigation", () => {
    it("moves focus to a tab disabled with the `disabled` prop", async () => {
      render(() => (
        <Tabs.Root value={0}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} disabled />
            <Tabs.Tab value={2} />
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const [firstTab, disabledTab] = screen.getAllByRole("tab");
      firstTab.focus();

      fireEvent.keyDown(firstTab, { key: "ArrowRight" });
      await flushMicrotasks();

      expect(disabledTab).toHaveFocus();
    });

    it("skips a natively disabled tab in a single keypress", async () => {
      render(() => (
        <Tabs.Root value={0}>
          <Tabs.List>
            <Tabs.Tab value={0} />
            <Tabs.Tab value={1} render={(props) => <button {...props} disabled />} />
            <Tabs.Tab value={2} />
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const [firstTab, , lastTab] = screen.getAllByRole("tab");
      firstTab.focus();

      fireEvent.keyDown(firstTab, { key: "ArrowRight" });
      await flushMicrotasks();

      expect(lastTab).toHaveFocus();

      fireEvent.keyDown(lastTab, { key: "ArrowLeft" });
      await flushMicrotasks();

      expect(firstTab).toHaveFocus();
    });
  });

  describe("roving focus after tab removal", () => {
    it("moves the tab stop off a hidden successor when the highlighted tab is removed", async () => {
      const [showMiddleTab, setShowMiddleTab] = createSignal(true);
      render(() => (
        <Tabs.Root defaultValue={0}>
          <Tabs.List>
            <Tabs.Tab value={0}>Tab 0</Tabs.Tab>
            <Show when={showMiddleTab()}>
              <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            </Show>
            <Tabs.Tab value={2} hidden>
              Tab 2
            </Tabs.Tab>
            <Tabs.Tab value={3}>Tab 3</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      const selectedTab = screen.getByText("Tab 0");
      selectedTab.focus();
      fireEvent.keyDown(selectedTab, { key: "ArrowRight" });
      await flushMicrotasks();

      setShowMiddleTab(false);
      await flushMicrotasks();

      const tabs = screen.getAllByRole("tab", { hidden: true });
      expect(tabs.map((tab) => tab.tabIndex)).toEqual([0, -1, -1]);
    });

    it("can fall back to a tab that is focusable when disabled", async () => {
      const [showSelectedTab, setShowSelectedTab] = createSignal(true);
      render(() => (
        <Tabs.Root value={2}>
          <Tabs.List>
            <Tabs.Tab value={0} disabled>
              Tab 0
            </Tabs.Tab>
            <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            <Show when={showSelectedTab()}>
              <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
            </Show>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      setShowSelectedTab(false);
      await flushMicrotasks();

      expect(screen.getByText("Tab 0")).toHaveAttribute("tabindex", "0");
      expect(screen.getByText("Tab 1")).toHaveAttribute("tabindex", "-1");
    });

    it("keeps the tab stop on the selected tab when focus is inside the list", async () => {
      const [showFirstTab, setShowFirstTab] = createSignal(true);
      render(() => (
        <Tabs.Root value={2}>
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

      const selectedTab = screen.getByText("Tab 2");
      selectedTab.focus();

      setShowFirstTab(false);
      await flushMicrotasks();

      const [unselectedTab] = screen.getAllByRole("tab");
      expect([unselectedTab.tabIndex, selectedTab.tabIndex]).toEqual([-1, 0]);
    });

    it("keeps tracking a successor through subsequent removals", async () => {
      const [showFirstTab, setShowFirstTab] = createSignal(true);
      const [showSelectedTab, setShowSelectedTab] = createSignal(true);
      render(() => (
        <Tabs.Root value={1}>
          <Tabs.List>
            <Show when={showFirstTab()}>
              <Tabs.Tab value={0}>Tab 0</Tabs.Tab>
            </Show>
            <Show when={showSelectedTab()}>
              <Tabs.Tab value={1}>Tab 1</Tabs.Tab>
            </Show>
            <Tabs.Tab value={2}>Tab 2</Tabs.Tab>
            <Tabs.Tab value={3}>Tab 3</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      setShowSelectedTab(false);
      await flushMicrotasks();

      expect(screen.getByText("Tab 2")).toHaveAttribute("tabindex", "0");

      setShowFirstTab(false);
      await flushMicrotasks();

      expect(screen.getByText("Tab 2")).toHaveAttribute("tabindex", "0");
      expect(screen.getByText("Tab 3")).toHaveAttribute("tabindex", "-1");
    });
  });

  it("can be named via `aria-label`", () => {
    render(() => (
      <Tabs.Root defaultValue={0}>
        <Tabs.List aria-label="string label">
          <Tabs.Tab value={0} />
        </Tabs.List>
      </Tabs.Root>
    ));

    expect(screen.getByRole("tablist")).toHaveAccessibleName("string label");
  });

  it("can be named via `aria-labelledby`", () => {
    render(() => (
      <>
        <h3 id="label-id">complex name</h3>
        <Tabs.Root defaultValue={0}>
          <Tabs.List aria-labelledby="label-id">
            <Tabs.Tab value={0} />
          </Tabs.List>
        </Tabs.Root>
      </>
    ));

    expect(screen.getByRole("tablist")).toHaveAccessibleName("complex name");
  });
});
