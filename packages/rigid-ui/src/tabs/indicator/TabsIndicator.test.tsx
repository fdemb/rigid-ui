import { createEffect, createSignal, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { screen, waitFor } from "@testing-library/dom";
import { describe, expect, it } from "vite-plus/test";
import { flushMicrotasks, isJSDOM, render } from "../../../test/test-utils";
import { getCssDimensions } from "../../utils/getCssDimensions";
import { Tabs } from "../index";

describe("<Tabs.Indicator />", () => {
  it("forwards props, class, style, and ref", async () => {
    let ref: HTMLSpanElement | undefined;
    render(() => (
      <Tabs.Root defaultValue={1}>
        <Tabs.List>
          <Tabs.Tab value={1} />
          <Tabs.Indicator
            data-testid="bubble"
            class="bubble"
            style={{ color: "red" }}
            ref={(element) => {
              ref = element;
            }}
          />
        </Tabs.List>
      </Tabs.Root>
    ));
    await flushMicrotasks();
    const bubble = screen.getByTestId("bubble");
    expect(bubble.tagName).toBe("SPAN");
    expect(bubble).toHaveAttribute("role", "presentation");
    expect(bubble).toHaveClass("bubble");
    expect(bubble.style.color).toBe("red");
    expect(bubble.style.getPropertyValue("--active-tab-width")).not.toBe("");
    expect(ref).toBe(bubble);
  });

  it("supports a callback render prop", async () => {
    render(() => (
      <Tabs.Root defaultValue={1}>
        <Tabs.List>
          <Tabs.Tab value={1} />
          <Tabs.Indicator render={(props) => <div {...props} data-testid="bubble" />} />
        </Tabs.List>
      </Tabs.Root>
    ));
    await flushMicrotasks();
    expect(screen.getByTestId("bubble").tagName).toBe("DIV");
  });

  it("exposes null active tab state when the selected value has no matching tab", async () => {
    const indicatorStates: Tabs.Indicator.State[] = [];

    render(() => (
      <Tabs.Root value="missing">
        <Tabs.List>
          <Tabs.Tab value="one">One</Tabs.Tab>
          <Tabs.Indicator
            render={(props, state) => {
              createEffect(
                () => ({ ...state }),
                (snapshot) => {
                  indicatorStates.push(snapshot);
                },
              );
              return <span data-testid="bubble" {...props} />;
            }}
          />
        </Tabs.List>
      </Tabs.Root>
    ));
    await flushMicrotasks();

    await waitFor(() => {
      expect(indicatorStates.length).toBeGreaterThan(0);
    });

    const state = indicatorStates.at(-1)!;
    expect(state.activeTabPosition).toBe(null);
    expect(state.activeTabSize).toBe(null);
    expect(screen.getByTestId("bubble")).toHaveAttribute("hidden");
  });

  describe.skipIf(isJSDOM)("rendering", () => {
    it("should not render when no tab is active", async () => {
      render(() => (
        <Tabs.Root value={null}>
          <Tabs.List>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>
      ));
      await flushMicrotasks();

      expect(screen.queryByTestId("bubble")).toBe(null);
    });

    function assertSize(actual: string, expected: number) {
      expect(Math.abs(parseFloat(actual) - expected)).toBeLessThanOrEqual(0.01);
    }

    function assertBubblePositionVariables(
      bubble: HTMLElement,
      tabList: HTMLElement,
      activeTab: HTMLElement,
    ) {
      const tabRect = activeTab.getBoundingClientRect();
      const tabListRect = tabList.getBoundingClientRect();
      const { width: tabWidth, height: tabHeight } = getCssDimensions(activeTab);
      const { width: tabListWidth, height: tabListHeight } = getCssDimensions(tabList);
      const scaleX = tabListWidth > 0 ? tabListRect.width / tabListWidth : 1;
      const scaleY = tabListHeight > 0 ? tabListRect.height / tabListHeight : 1;

      const relativeLeft =
        (tabRect.left - tabListRect.left) / scaleX + tabList.scrollLeft - tabList.clientLeft;
      const relativeTop =
        (tabRect.top - tabListRect.top) / scaleY + tabList.scrollTop - tabList.clientTop;
      const relativeRight = tabList.scrollWidth - relativeLeft - tabWidth;
      const relativeBottom = tabList.scrollHeight - relativeTop - tabHeight;

      const style = window.getComputedStyle(bubble);
      assertSize(style.getPropertyValue("--active-tab-left"), relativeLeft);
      assertSize(style.getPropertyValue("--active-tab-right"), relativeRight);
      assertSize(style.getPropertyValue("--active-tab-top"), relativeTop);
      assertSize(style.getPropertyValue("--active-tab-bottom"), relativeBottom);
      assertSize(style.getPropertyValue("--active-tab-width"), tabWidth);
      assertSize(style.getPropertyValue("--active-tab-height"), tabHeight);
    }

    // Lays the indicator over the active tab with the CSS variables it exposes, the way
    // consumers position it.
    const STYLED_INDICATOR_CSS = `
      [data-testid="bubble"] {
        position: absolute;
        top: 0;
        left: 0;
        width: var(--active-tab-width);
        height: var(--active-tab-height);
        transform: translate(var(--active-tab-left), var(--active-tab-top));
      }
    `;

    // Activates the last tab on purpose: its offset is non-zero, so a wrong rect-based offset
    // under rotation would land visibly off.
    function renderTransformedTabs(
      wrapperStyle: JSX.CSSProperties,
      tabsListStyle: JSX.CSSProperties = { display: "flex", position: "relative" },
    ) {
      render(() => (
        <>
          <style>{STYLED_INDICATOR_CSS}</style>
          <div style={wrapperStyle}>
            <Tabs.Root value={3}>
              <Tabs.List style={tabsListStyle}>
                <Tabs.Tab value={1} style={{ width: "80px", height: "32px" }}>
                  One
                </Tabs.Tab>
                <Tabs.Tab value={2} style={{ width: "80px", height: "32px" }}>
                  Two
                </Tabs.Tab>
                <Tabs.Tab value={3} style={{ width: "80px", height: "32px" }}>
                  Three
                </Tabs.Tab>
                <Tabs.Indicator data-testid="bubble" />
              </Tabs.List>
            </Tabs.Root>
          </div>
        </>
      ));
    }

    function renderTranslatedActiveTab(activeTabStyle: JSX.CSSProperties) {
      render(() => (
        <>
          <style>{STYLED_INDICATOR_CSS}</style>
          <Tabs.Root value={3}>
            <Tabs.List style={{ display: "flex", position: "relative" }}>
              <Tabs.Tab value={1} style={{ width: "80px", height: "32px" }}>
                One
              </Tabs.Tab>
              <Tabs.Tab value={2} style={{ width: "80px", height: "32px" }}>
                Two
              </Tabs.Tab>
              <Tabs.Tab value={3} style={{ width: "80px", height: "32px", ...activeTabStyle }}>
                Three
              </Tabs.Tab>
              <Tabs.Indicator data-testid="bubble" />
            </Tabs.List>
          </Tabs.Root>
        </>
      ));
    }

    function waitForEdgesToMatch(
      edge: "left" | "top" | "right" | "bottom",
      bubble: HTMLElement,
      activeTab: HTMLElement,
    ) {
      return waitFor(() => {
        const bubbleRect = bubble.getBoundingClientRect();
        const tabRect = activeTab.getBoundingClientRect();
        expect(Math.abs(bubbleRect[edge] - tabRect[edge])).toBeLessThanOrEqual(1);
      });
    }

    // Both share the ancestor transform, so a correctly positioned indicator's on-screen rect
    // coincides with the active tab's, whatever the transform.
    async function waitForBubbleToOverlapActiveTab(bubble: HTMLElement, activeTab: HTMLElement) {
      await waitForEdgesToMatch("left", bubble, activeTab);
      await waitForEdgesToMatch("top", bubble, activeTab);
      await waitForEdgesToMatch("right", bubble, activeTab);
      await waitForEdgesToMatch("bottom", bubble, activeTab);
    }

    it("should set CSS variables corresponding to the active tab", async () => {
      render(() => (
        <Tabs.Root value={2}>
          <Tabs.List>
            <Tabs.Tab value={1}>One</Tabs.Tab>
            <Tabs.Tab value={2}>Two</Tabs.Tab>
            <Tabs.Tab value={3}>Three</Tabs.Tab>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>
      ));

      await waitFor(() => {
        assertBubblePositionVariables(
          screen.getByTestId("bubble"),
          screen.getByRole("tablist"),
          screen.getAllByRole("tab")[1],
        );
      });
    });

    it("should update the position and movement variables when the active tab changes", async () => {
      const [value, setValue] = createSignal(2);
      render(() => (
        <Tabs.Root value={value()}>
          <Tabs.List>
            <Tabs.Tab value={1}>One</Tabs.Tab>
            <Tabs.Tab value={2}>Two</Tabs.Tab>
            <Tabs.Tab value={3}>Three</Tabs.Tab>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>
      ));

      setValue(3);
      const bubble = screen.getByTestId("bubble");
      const tabs = screen.getAllByRole("tab");
      const tabList = screen.getByRole("tablist");

      await waitFor(() => assertBubblePositionVariables(bubble, tabList, tabs[2]));

      setValue(1);
      await waitFor(() => assertBubblePositionVariables(bubble, tabList, tabs[0]));
    });

    it("should update the position variables when the tab list is resized", async () => {
      const [width, setWidth] = createSignal("400px");
      render(() => (
        <Tabs.Root value={1} style={{ width: width() }}>
          <Tabs.List style={{ display: "flex" }}>
            <Tabs.Tab value={1} style={{ flex: "1 1 auto" }}>
              One
            </Tabs.Tab>
            <Tabs.Tab value={2} style={{ flex: "1 1 auto" }}>
              Two
            </Tabs.Tab>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>
      ));

      const bubble = screen.getByTestId("bubble");
      const activeTab = screen.getAllByRole("tab")[0];
      const tabList = screen.getByRole("tablist");

      await waitFor(() => assertBubblePositionVariables(bubble, tabList, activeTab));

      setWidth("800px");

      await waitFor(() => assertBubblePositionVariables(bubble, tabList, activeTab));
    });

    it("should account for scroll and border when the tab list is transformed", async () => {
      render(() => (
        <div style={{ transform: "scale(1.5)" }}>
          <Tabs.Root value={3}>
            <Tabs.List
              data-testid="tab-list"
              style={{
                width: "240px",
                display: "flex",
                gap: "8px",
                "overflow-x": "auto",
                border: "6px solid black",
                padding: "4px",
              }}
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <Tabs.Tab value={value} style={{ flex: "0 0 120px" }}>
                  {value}
                </Tabs.Tab>
              ))}
              <Tabs.Indicator data-testid="bubble" />
            </Tabs.List>
          </Tabs.Root>
        </div>
      ));

      const bubble = screen.getByTestId("bubble");
      const tabList = screen.getByTestId("tab-list");
      const activeTab = screen.getAllByRole("tab")[2];

      tabList.scrollLeft = 80;

      await waitFor(() => assertBubblePositionVariables(bubble, tabList, activeTab));
    });

    it("accounts for a scrolled container between the tab list and the active tab", async () => {
      render(() => (
        <>
          <style>{STYLED_INDICATOR_CSS}</style>
          <Tabs.Root value={3}>
            <Tabs.List style={{ display: "flex", position: "relative" }}>
              {/* 240px of tabs inside a 200px viewport, so the container scrolls by 40px. */}
              <div
                data-testid="scroller"
                style={{ display: "flex", width: "200px", "overflow-x": "auto" }}
              >
                {[1, 2, 3].map((value) => (
                  <Tabs.Tab
                    value={value}
                    style={{ width: "80px", height: "32px", "flex-shrink": 0 }}
                  >
                    {value}
                  </Tabs.Tab>
                ))}
              </div>
              <Tabs.Indicator data-testid="bubble" />
            </Tabs.List>
          </Tabs.Root>
        </>
      ));

      const scroller = screen.getByTestId("scroller");
      const bubble = screen.getByTestId("bubble");
      const activeTab = screen.getAllByRole("tab")[2];

      scroller.scrollLeft = 40;
      // Scrolling alone doesn't notify the indicator, only resizes do, so nudge the active tab.
      activeTab.style.width = "84px";

      await waitForBubbleToOverlapActiveTab(bubble, activeTab);
    });

    for (const [label, wrapperStyle] of [
      ["a 2D rotation", { transform: "rotate(40deg)" }],
      ["a size-preserving flip", { transform: "scaleX(-1)" }],
      ["the rotate longhand", { rotate: "40deg" }],
      ["a flipping scale longhand", { scale: "-1 1" }],
      ["a 3D rotation (#4837)", { transform: "perspective(600px) rotateY(35deg)" }],
    ] as const) {
      it(`overlays the active tab when an ancestor has ${label}`, async () => {
        renderTransformedTabs(wrapperStyle as JSX.CSSProperties);

        const bubble = screen.getByTestId("bubble");
        const activeTab = screen.getAllByRole("tab")[2];

        await waitForBubbleToOverlapActiveTab(bubble, activeTab);
        expect(bubble).not.toHaveAttribute("hidden");
      });
    }

    it("sets transformed offsets relative to the tab list when the list is not the offset parent", async () => {
      renderTransformedTabs(
        { position: "relative", transform: "rotate(40deg)" },
        { display: "flex", "margin-left": "40px" },
      );

      const bubble = screen.getByTestId("bubble");

      await waitFor(() => {
        assertSize(window.getComputedStyle(bubble).getPropertyValue("--active-tab-left"), 160);
      });
      await waitFor(() => {
        assertSize(window.getComputedStyle(bubble).getPropertyValue("--active-tab-top"), 0);
      });
    });

    for (const [label, activeTabStyle] of [
      ["its own transform translation", { transform: "translateX(12px) translateY(4px)" }],
      ["the translate longhand", { translate: "12px 4px" }],
      // 50% of 80px is 40px across, 25% of 32px is 8px down.
      ["the translate longhand with percentages", { translate: "50% 25%" }],
    ] as const) {
      it(`follows the active tab when it uses ${label}`, async () => {
        renderTranslatedActiveTab(activeTabStyle as JSX.CSSProperties);

        await waitForBubbleToOverlapActiveTab(
          screen.getByTestId("bubble"),
          screen.getAllByRole("tab")[2],
        );
      });
    }

    it("updates position when a different tab resizes", async () => {
      render(() => (
        <Tabs.Root value={2}>
          <Tabs.List
            data-testid="tab-list"
            style={{ width: "300px", display: "flex", overflow: "hidden" }}
          >
            <Tabs.Tab
              data-testid="first-tab"
              value={1}
              style={{ width: "100px", "flex-shrink": 0 }}
            >
              One
            </Tabs.Tab>
            <Tabs.Tab value={2} style={{ width: "100px", "flex-shrink": 0 }}>
              Two
            </Tabs.Tab>
            <Tabs.Tab value={3} style={{ width: "100px", "flex-shrink": 0 }}>
              Three
            </Tabs.Tab>
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>
      ));

      const bubble = screen.getByTestId("bubble");
      const tabList = screen.getByTestId("tab-list");
      const activeTab = screen.getAllByRole("tab")[1];

      await waitFor(() => assertBubblePositionVariables(bubble, tabList, activeTab));

      screen.getByTestId("first-tab").setAttribute("style", "width: 140px; flex-shrink: 0;");

      await waitFor(() => assertBubblePositionVariables(bubble, tabList, activeTab));
    });

    it("falls back to offset positions when the tab list is scaled to zero", async () => {
      render(() => (
        <div style={{ transform: "scale(0)" }}>
          <Tabs.Root value={2}>
            <Tabs.List
              data-testid="tab-list"
              style={{ position: "relative", width: "300px", display: "flex", overflow: "hidden" }}
            >
              <Tabs.Tab value={1} style={{ width: "100px", "flex-shrink": 0 }}>
                One
              </Tabs.Tab>
              <Tabs.Tab value={2} style={{ width: "100px", "flex-shrink": 0 }}>
                Two
              </Tabs.Tab>
              <Tabs.Indicator data-testid="bubble" />
            </Tabs.List>
          </Tabs.Root>
        </div>
      ));

      const bubble = screen.getByTestId("bubble");
      const activeTab = screen.getAllByRole("tab")[1];

      // The collapsed rects can't be divided by, so the indicator uses the untransformed
      // offsets instead of producing `NaN` positions.
      await waitFor(() => {
        assertSize(
          window.getComputedStyle(bubble).getPropertyValue("--active-tab-left"),
          activeTab.offsetLeft,
        );
      });

      const style = window.getComputedStyle(bubble);
      assertSize(style.getPropertyValue("--active-tab-top"), activeTab.offsetTop);
      assertSize(style.getPropertyValue("--active-tab-width"), 100);
      expect(bubble).not.toHaveAttribute("hidden");
    });

    it("updates position when a new tab is inserted and then resized", async () => {
      const [inserted, setInserted] = createSignal(false);
      render(() => (
        <Tabs.Root value={2}>
          <Tabs.List
            data-testid="tab-list"
            style={{ width: "320px", display: "flex", overflow: "hidden" }}
          >
            <Show when={inserted()}>
              <Tabs.Tab
                data-testid="inserted-tab"
                value={0}
                style={{ width: "60px", "flex-shrink": 0 }}
              >
                Inserted
              </Tabs.Tab>
            </Show>
            {[1, 2, 3].map((value) => (
              <Tabs.Tab value={value} style={{ width: "100px", "flex-shrink": 0 }}>
                {value}
              </Tabs.Tab>
            ))}
            <Tabs.Indicator data-testid="bubble" />
          </Tabs.List>
        </Tabs.Root>
      ));

      const bubble = screen.getByTestId("bubble");
      const tabList = screen.getByTestId("tab-list");
      const selectedTab = () => screen.getByRole("tab", { selected: true });

      await waitFor(() => assertBubblePositionVariables(bubble, tabList, selectedTab()));

      setInserted(true);
      await waitFor(() => assertBubblePositionVariables(bubble, tabList, selectedTab()));

      screen.getByTestId("inserted-tab").setAttribute("style", "width: 120px; flex-shrink: 0;");
      await waitFor(() => assertBubblePositionVariables(bubble, tabList, selectedTab()));
    });

    it("updates all indicators when a different tab resizes", async () => {
      render(() => (
        <Tabs.Root value={2}>
          <Tabs.List
            data-testid="tab-list"
            style={{ width: "300px", display: "flex", overflow: "hidden" }}
          >
            <Tabs.Tab
              data-testid="first-tab"
              value={1}
              style={{ width: "100px", "flex-shrink": 0 }}
            >
              One
            </Tabs.Tab>
            <Tabs.Tab value={2} style={{ width: "100px", "flex-shrink": 0 }}>
              Two
            </Tabs.Tab>
            <Tabs.Tab value={3} style={{ width: "100px", "flex-shrink": 0 }}>
              Three
            </Tabs.Tab>
            <Tabs.Indicator data-testid="bubble-1" />
            <Tabs.Indicator data-testid="bubble-2" />
          </Tabs.List>
        </Tabs.Root>
      ));

      const bubble1 = screen.getByTestId("bubble-1");
      const bubble2 = screen.getByTestId("bubble-2");
      const tabList = screen.getByTestId("tab-list");
      const activeTab = screen.getAllByRole("tab")[1];

      await waitFor(() => {
        assertBubblePositionVariables(bubble1, tabList, activeTab);
        assertBubblePositionVariables(bubble2, tabList, activeTab);
      });

      screen.getByTestId("first-tab").setAttribute("style", "width: 140px; flex-shrink: 0;");

      await waitFor(() => {
        assertBubblePositionVariables(bubble1, tabList, activeTab);
        assertBubblePositionVariables(bubble2, tabList, activeTab);
      });
    });
  });
});
