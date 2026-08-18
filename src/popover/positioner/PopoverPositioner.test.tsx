import { createSignal, Errored } from "solid-js";
import { screen, waitFor } from "@testing-library/dom";
import { describe, expect, it } from "vite-plus/test";
import { isJSDOM, render, waitForPositioned, waitSingleFrame } from "../../../test/test-utils";
import { Popover } from "../index";

// Ported from Base UI's `PopoverPositioner.test.tsx`. Cases that exercise React renderer
// semantics (`describeConformance`, `render` prop replacement) or Base UI parts this library
// does not implement (`Viewport` adaptive origin, `Tooltip` integration) are inapplicable.
// Positions are asserted relative to the measured trigger rect rather than against Base UI's
// hardcoded baselines, which depend on their renderer's wrapper markup.

const triggerStyle = { width: "72px", height: "36px" };
const popupStyle = { width: "52px", height: "24px" };

function rect(element: Element) {
  return element.getBoundingClientRect();
}

describe("<Popover.Positioner />", () => {
  it("throws a descriptive error when rendered outside <Popover.Portal>", () => {
    let caught: unknown;
    // An uncaught throw halts Solid's reactive system for the rest of the module, so the error
    // has to be captured by a boundary rather than asserted with `expect(...).toThrow()`.
    render(() => (
      <Errored
        fallback={(error) => {
          caught = error();
          return null;
        }}
      >
        <Popover.Root defaultOpen>
          <Popover.Positioner />
        </Popover.Root>
      </Errored>
    ));

    expect((caught as Error).message).toBe(
      "Rigid UI: <Popover.Positioner> must be used within <Popover.Portal>.",
    );
  });

  describe.skipIf(isJSDOM)("prop: sideOffset", () => {
    it("offsets the side when a number is specified", async () => {
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger style={triggerStyle}>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" sideOffset={7}>
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const positioner = screen.getByTestId("positioner");
      const trigger = screen.getByRole("button", { name: "Trigger" });
      await waitForPositioned(positioner);

      await waitFor(() => expect(rect(positioner).top - rect(trigger).bottom).toBeCloseTo(7, 0));
    });

    it("offsets the side when a function is specified", async () => {
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger style={triggerStyle}>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner
              data-testid="positioner"
              sideOffset={(data) => data.positioner.width + data.anchor.width}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const positioner = screen.getByTestId("positioner");
      const trigger = screen.getByRole("button", { name: "Trigger" });
      await waitForPositioned(positioner);

      await waitFor(() =>
        expect(rect(positioner).top - rect(trigger).bottom).toBeCloseTo(52 + 72, 0),
      );
    });

    it("can read the latest side inside sideOffset", async () => {
      let side = "none";
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger style={triggerStyle}>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner
              data-testid="positioner"
              side="left"
              sideOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      await waitForPositioned(screen.getByTestId("positioner"));
      // The trigger sits at the left viewport edge, so `left` cannot fit and flips.
      await waitFor(() => expect(side).toBe("right"));
    });

    it("can read the latest align inside sideOffset", async () => {
      let align = "none";
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger style={triggerStyle}>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner
              data-testid="positioner"
              side="right"
              align="start"
              sideOffset={(data) => {
                align = data.align;
                return 0;
              }}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      await waitForPositioned(screen.getByTestId("positioner"));
      await waitFor(() => expect(align).toBe("end"));
    });

    it("reads the logical side inside sideOffset", async () => {
      let side = "none";
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger style={triggerStyle}>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner
              data-testid="positioner"
              side="inline-start"
              sideOffset={(data) => {
                side = data.side;
                return 0;
              }}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      await waitForPositioned(screen.getByTestId("positioner"));
      await waitFor(() => expect(side).toBe("inline-end"));
    });

    it("resolves the logical side against the anchor's direction", async () => {
      let side = "none";
      render(() => (
        <div dir="rtl">
          <Popover.Root defaultOpen>
            <Popover.Trigger
              style={{ position: "fixed", left: "120px", top: "120px", ...triggerStyle }}
            >
              Trigger
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner
                data-testid="positioner"
                side="inline-start"
                sideOffset={(data) => {
                  side = data.side;
                  return 0;
                }}
              >
                <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </div>
      ));

      const positioner = screen.getByTestId("positioner");
      const trigger = screen.getByRole("button", { name: "Trigger" });
      await waitForPositioned(positioner);

      // In RTL `inline-start` resolves to the physical right side, which fits here, so the
      // requested logical side survives.
      await waitFor(() => expect(side).toBe("inline-start"));
      expect(rect(positioner).left).toBeGreaterThanOrEqual(rect(trigger).right);
    });
  });

  describe.skipIf(isJSDOM)("prop: alignOffset", () => {
    it("offsets the alignment when a number is specified", async () => {
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger style={triggerStyle}>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" align="start" alignOffset={7}>
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const positioner = screen.getByTestId("positioner");
      const trigger = screen.getByRole("button", { name: "Trigger" });
      await waitForPositioned(positioner);

      await waitFor(() => expect(rect(positioner).left - rect(trigger).left).toBeCloseTo(7, 0));
    });

    it("offsets the alignment when a function is specified", async () => {
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger style={triggerStyle}>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner
              data-testid="positioner"
              align="start"
              alignOffset={(data) => data.anchor.width - data.positioner.width}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const positioner = screen.getByTestId("positioner");
      const trigger = screen.getByRole("button", { name: "Trigger" });
      await waitForPositioned(positioner);

      await waitFor(() =>
        expect(rect(positioner).left - rect(trigger).left).toBeCloseTo(72 - 52, 0),
      );
    });

    it("can read the latest align inside alignOffset", async () => {
      let align = "none";
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger style={triggerStyle}>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner
              data-testid="positioner"
              side="right"
              align="start"
              alignOffset={(data) => {
                align = data.align;
                return 0;
              }}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      await waitForPositioned(screen.getByTestId("positioner"));
      await waitFor(() => expect(align).toBe("end"));
    });
  });

  describe.skipIf(isJSDOM)("collision handling", () => {
    it("flips to the opposite side when the requested side does not fit", async () => {
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger
            style={{ position: "fixed", left: "120px", bottom: "4px", ...triggerStyle }}
          >
            Trigger
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" side="bottom">
              <Popover.Popup style={{ width: "120px", height: "100px" }}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const positioner = screen.getByTestId("positioner");
      const trigger = screen.getByRole("button", { name: "Trigger" });
      await waitForPositioned(positioner);

      await waitFor(() => expect(positioner).toHaveAttribute("data-side", "top"));
      expect(rect(positioner).bottom).toBeLessThanOrEqual(rect(trigger).top);
    });

    it("reports the flipped side to the popup and arrow", async () => {
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger
            style={{ position: "fixed", left: "120px", bottom: "4px", ...triggerStyle }}
          >
            Trigger
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" side="bottom">
              <Popover.Popup data-testid="popup" style={{ width: "120px", height: "100px" }}>
                <Popover.Arrow data-testid="arrow" style={{ width: "12px", height: "8px" }} />
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      await waitForPositioned(screen.getByTestId("positioner"));

      // The whole subtree must agree on the rendered side, not the requested one. This is what
      // CSS anchor positioning could not report back to JS.
      await waitFor(() => expect(screen.getByTestId("popup")).toHaveAttribute("data-side", "top"));
      expect(screen.getByTestId("arrow")).toHaveAttribute("data-side", "top");
    });

    it("preserves sideOffset after flipping the side", async () => {
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger
            style={{ position: "fixed", left: "120px", bottom: "4px", ...triggerStyle }}
          >
            Trigger
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" side="bottom" sideOffset={12}>
              <Popover.Popup style={{ width: "120px", height: "80px" }}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const positioner = screen.getByTestId("positioner");
      const trigger = screen.getByRole("button", { name: "Trigger" });
      await waitForPositioned(positioner);

      await waitFor(() => expect(rect(trigger).top - rect(positioner).bottom).toBeCloseTo(12, 0));
    });

    it("rests exactly at collisionPadding from the colliding edge", async () => {
      const collisionPadding = 12;
      render(() => (
        // Pinned near the bottom so the bottom-side popup flips to the top and collides with
        // the top viewport edge.
        <div style={{ position: "fixed", bottom: "8px", left: "16px" }}>
          <Popover.Root defaultOpen>
            <Popover.Trigger style={triggerStyle}>Trigger</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner
                data-testid="positioner"
                side="bottom"
                sideOffset={8}
                collisionPadding={collisionPadding}
                collisionAvoidance={{ fallbackAxisSide: "none" }}
              >
                <Popover.Popup
                  style={{
                    width: "200px",
                    height: "1000px",
                    "max-height": "var(--available-height)",
                  }}
                >
                  Popup
                </Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </div>
      ));

      const positioner = screen.getByTestId("positioner");
      await waitForPositioned(positioner);

      await waitFor(() => expect(positioner).toHaveAttribute("data-side", "top"));
      // The preferred-side bias that `flip()` uses must not leak into the resting position:
      // the popup sits exactly `collisionPadding` from the edge, not one pixel further.
      await waitFor(() => expect(Math.round(rect(positioner).top)).toBe(collisionPadding));
    });

    it("exposes the remaining space through --available-height", async () => {
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger
            style={{ position: "fixed", left: "20px", top: "20px", ...triggerStyle }}
          >
            Trigger
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" side="bottom" collisionPadding={10}>
              <Popover.Popup style={{ width: "100px", height: "40px" }}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const positioner = screen.getByTestId("positioner");
      await waitForPositioned(positioner);

      // The trigger's bottom edge is at 56px; with 10px padding the popup has the rest of the
      // viewport below it. A viewport-sized value would mean `size()` never ran.
      await waitFor(() => {
        const available = parseFloat(positioner.style.getPropertyValue("--available-height"));
        expect(available).toBeCloseTo(window.innerHeight - 56 - 10, 0);
      });
    });
  });

  describe.skipIf(isJSDOM)("anchor tracking", () => {
    it("remains anchored when the trigger moves", async () => {
      const [top, setTop] = createSignal(0);
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger
            style={{ width: "100px", height: "100px", position: "relative", top: `${top()}px` }}
          >
            Trigger
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner">
              <Popover.Popup style={{ width: "100px", height: "100px" }}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const positioner = screen.getByTestId("positioner");
      await waitForPositioned(positioner);
      const initialY = rect(positioner).y;

      setTop(100);
      await waitFor(() => expect(rect(positioner).y).toBeCloseTo(initialY + 100, 0));
    });

    it("remains anchored when the trigger moves and keepMounted is set", async () => {
      const [top, setTop] = createSignal(0);
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger
            style={{ width: "100px", height: "100px", position: "relative", top: `${top()}px` }}
          >
            Trigger
          </Popover.Trigger>
          <Popover.Portal keepMounted>
            <Popover.Positioner data-testid="positioner">
              <Popover.Popup style={{ width: "100px", height: "100px" }}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const positioner = screen.getByTestId("positioner");
      await waitForPositioned(positioner);
      const initialY = rect(positioner).y;

      setTop(100);
      await waitFor(() => expect(rect(positioner).y).toBeCloseTo(initialY + 100, 0));
    });

    it("does not follow the anchor when disableAnchorTracking is set", async () => {
      render(() => (
        <div data-testid="scroller" style={{ height: "72px", overflow: "auto" }}>
          <div style={{ height: "200px" }}>
            <Popover.Root defaultOpen>
              <Popover.Trigger data-testid="trigger" style={triggerStyle}>
                Trigger
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Positioner data-testid="positioner" disableAnchorTracking>
                  <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        </div>
      ));

      const scroller = screen.getByTestId("scroller");
      const trigger = screen.getByTestId("trigger");
      const positioner = screen.getByTestId("positioner");
      await waitForPositioned(positioner);

      const initialTriggerY = rect(trigger).y;
      const initialPositionerY = rect(positioner).y;

      scroller.scrollTop = 20;
      await waitSingleFrame();
      await waitSingleFrame();

      expect(rect(trigger).y).toBeCloseTo(initialTriggerY - 20, 0);
      expect(rect(positioner).y).toBeCloseTo(initialPositionerY, 0);
    });

    it("marks the positioner when the anchor is scrolled out of view", async () => {
      render(() => (
        <div data-testid="scroller" style={{ height: "60px", overflow: "auto" }}>
          <Popover.Root defaultOpen>
            <Popover.Trigger style={triggerStyle}>Trigger</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner data-testid="positioner">
                <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
          <div style={{ height: "600px" }} />
        </div>
      ));

      const positioner = screen.getByTestId("positioner");
      await waitForPositioned(positioner);
      expect(positioner).not.toHaveAttribute("data-anchor-hidden");

      screen.getByTestId("scroller").scrollTop = 400;
      await waitFor(() => expect(positioner).toHaveAttribute("data-anchor-hidden"));
    });
  });

  describe.skipIf(isJSDOM)("prop: anchor", () => {
    it("positions against a custom element anchor", async () => {
      let anchor: HTMLDivElement | undefined;
      render(() => (
        <div>
          <div
            ref={(element) => (anchor = element)}
            style={{
              position: "fixed",
              left: "300px",
              top: "100px",
              width: "40px",
              height: "20px",
            }}
          >
            Anchor
          </div>
          <Popover.Root defaultOpen>
            <Popover.Trigger style={triggerStyle}>Trigger</Popover.Trigger>
            <Popover.Portal>
              <Popover.Positioner data-testid="positioner" anchor={() => anchor ?? null}>
                <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
              </Popover.Positioner>
            </Popover.Portal>
          </Popover.Root>
        </div>
      ));

      const positioner = screen.getByTestId("positioner");
      await waitForPositioned(positioner);

      await waitFor(() => expect(rect(positioner).top).toBeCloseTo(120, 0));
      // Centered on a 40px-wide anchor starting at 300px.
      expect(rect(positioner).left + rect(positioner).width / 2).toBeCloseTo(320, 0);
    });

    it("positions against a virtual anchor", async () => {
      const virtualAnchor = {
        getBoundingClientRect: () => ({
          x: 250,
          y: 150,
          width: 0,
          height: 0,
          top: 150,
          right: 250,
          bottom: 150,
          left: 250,
        }),
      };

      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger style={triggerStyle}>Trigger</Popover.Trigger>
          <Popover.Portal>
            {/*
              Padding is zeroed so the assertion reads the raw anchored coordinate: against a
              zero-area anchor, `shift()`'s limiter otherwise keeps the popup within half the
              collision padding of the anchor's edge.
            */}
            <Popover.Positioner
              data-testid="positioner"
              anchor={virtualAnchor}
              align="start"
              arrowPadding={0}
              collisionPadding={0}
            >
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const positioner = screen.getByTestId("positioner");
      await waitForPositioned(positioner);

      // A zero-area anchor is how a context menu tracks the pointer.
      await waitFor(() => expect(rect(positioner).top).toBeCloseTo(150, 0));
      expect(rect(positioner).left).toBeCloseTo(250, 0);
    });

    it("observes a custom anchor for resize-driven updates", async () => {
      const originalResizeObserver = window.ResizeObserver;
      const observedElements: Element[] = [];

      class TestResizeObserver {
        observe(element: Element) {
          observedElements.push(element);
        }
        unobserve() {}
        disconnect() {}
      }

      window.ResizeObserver = TestResizeObserver as unknown as typeof ResizeObserver;

      try {
        let anchor: HTMLDivElement | undefined;
        render(() => (
          <div>
            <div
              ref={(element) => (anchor = element)}
              data-testid="custom-anchor"
              style={{ width: "50px", height: "50px", position: "relative" }}
            >
              Anchor
            </div>
            <Popover.Root defaultOpen>
              <Popover.Trigger style={triggerStyle}>Trigger</Popover.Trigger>
              <Popover.Portal keepMounted>
                <Popover.Positioner data-testid="positioner" anchor={() => anchor ?? null}>
                  <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
                </Popover.Positioner>
              </Popover.Portal>
            </Popover.Root>
          </div>
        ));

        await waitFor(() =>
          expect(observedElements).toContain(screen.getByTestId("custom-anchor")),
        );
      } finally {
        window.ResizeObserver = originalResizeObserver;
      }
    });
  });

  describe.skipIf(isJSDOM)("arrow", () => {
    it("centers the arrow on the anchor when the popup is not centered", async () => {
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger
            style={{ position: "fixed", left: "120px", top: "120px", width: "80px" }}
          >
            Trigger
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" side="bottom" align="start">
              <Popover.Popup style={{ width: "120px", height: "60px" }}>
                <Popover.Arrow data-testid="arrow" style={{ width: "12px", height: "8px" }} />
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const positioner = screen.getByTestId("positioner");
      const trigger = screen.getByRole("button", { name: "Trigger" });
      const arrow = screen.getByTestId("arrow");
      await waitForPositioned(positioner);

      const arrowCenter = () => rect(arrow).left + rect(arrow).width / 2;
      const triggerCenter = rect(trigger).left + rect(trigger).width / 2;
      const positionerCenter = rect(positioner).left + rect(positioner).width / 2;

      await waitFor(() => expect(arrowCenter()).toBeCloseTo(triggerCenter, 0));
      expect(arrowCenter()).not.toBeCloseTo(positionerCenter, 0);
    });

    it("marks the arrow as uncentered when it cannot reach the anchor center", async () => {
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger style={{ position: "fixed", left: "0px", top: "120px", width: "20px" }}>
            Trigger
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner" side="bottom" arrowPadding={20}>
              <Popover.Popup style={{ width: "300px", height: "60px" }}>
                <Popover.Arrow data-testid="arrow" style={{ width: "12px", height: "8px" }} />
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      await waitForPositioned(screen.getByTestId("positioner"));
      await waitFor(() => expect(screen.getByTestId("arrow")).toHaveAttribute("data-uncentered"));
    });
  });

  describe.skipIf(isJSDOM)("styles", () => {
    it("positions with a transform once measured", async () => {
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger style={triggerStyle}>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner">
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const positioner = screen.getByTestId("positioner");
      await waitFor(() => expect(positioner.style.transform).not.toBe(""));
      expect(positioner.style.opacity).toBe("");
    });

    it("exposes the anchor size and transform origin", async () => {
      render(() => (
        <Popover.Root defaultOpen>
          <Popover.Trigger style={triggerStyle}>Trigger</Popover.Trigger>
          <Popover.Portal>
            <Popover.Positioner data-testid="positioner">
              <Popover.Popup style={popupStyle}>Popup</Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      ));

      const positioner = screen.getByTestId("positioner");
      await waitForPositioned(positioner);

      await waitFor(() => expect(positioner.style.getPropertyValue("--anchor-width")).toBe("72px"));
      expect(positioner.style.getPropertyValue("--anchor-height")).toBe("36px");
      expect(positioner.style.getPropertyValue("--positioner-width")).toBe("52px");
      expect(positioner.style.getPropertyValue("--transform-origin")).not.toBe("");
    });
  });
});
