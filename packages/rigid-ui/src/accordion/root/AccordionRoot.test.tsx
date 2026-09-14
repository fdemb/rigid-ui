import { createSignal, Show } from "solid-js";
import { fireEvent, screen, waitFor } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { flushMicrotasks, isJSDOM, render } from "../../../test/test-utils";
import { Accordion } from "../index";
import { REASONS } from "../../internals/reasons";

// Ported from Base UI's `root/AccordionRoot.test.tsx`. React-only cases are omitted:
// `describeConformance` (replaced with an explicit forwarding test), hydration, and
// `React.Activity`. Interaction cases that Base UI gates to real browsers run unskipped
// here because `fireEvent` drives the same toggle path in JSDOM.

const PANEL_CONTENT_1 = "Panel contents 1";
const PANEL_CONTENT_2 = "Panel contents 2";

function BasicItem(props: { value?: unknown; disabled?: boolean; label: string; panel: string }) {
  return (
    <Accordion.Item value={props.value} disabled={props.disabled}>
      <Accordion.Header>
        <Accordion.Trigger>Trigger {props.label}</Accordion.Trigger>
      </Accordion.Header>
      <Accordion.Panel>{props.panel}</Accordion.Panel>
    </Accordion.Item>
  );
}

describe("<Accordion.Root />", () => {
  it("forwards props, class, style, ref, and events to the root element", () => {
    let ref: HTMLElement | undefined;
    const onClick = vi.fn();
    render(() => (
      <Accordion.Root
        data-testid="root"
        id="custom"
        class="custom"
        style={{ color: "red" }}
        ref={(element) => {
          ref = element;
        }}
        onClick={onClick}
      />
    ));
    const element = screen.getByTestId("root");
    expect(element.tagName).toBe("DIV");
    expect(element).toHaveAttribute("id", "custom");
    expect(element).toHaveClass("custom");
    expect(element.style.color).toBe("red");
    expect(ref).toBe(element);
    fireEvent.click(element);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("renders the orientation state attribute and no value attribute", () => {
    render(() => <Accordion.Root value={["a", "b"]} multiple data-testid="root" />);
    const element = screen.getByTestId("root");
    expect(element).toHaveAttribute("data-orientation", "vertical");
    expect(element).not.toHaveAttribute("data-value");
  });

  it("warns when hiddenUntilFound overrides keepMounted={false}", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    try {
      render(() => (
        <Accordion.Root hiddenUntilFound keepMounted={false}>
          <Accordion.Item>
            <Accordion.Panel>Panel</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));
      await flushMicrotasks();

      expect(warnSpy).toHaveBeenCalledWith(
        "Base UI: The `keepMounted={false}` prop on `Accordion.Root` is ignored when `hiddenUntilFound` is enabled, since panels must remain mounted while closed.",
      );
      expect(screen.getByText("Panel").getAttribute("hidden")).toBe("until-found");
    } finally {
      warnSpy.mockRestore();
    }
  });

  describe("ARIA attributes", () => {
    it("renders correct ARIA attributes", () => {
      render(() => (
        <Accordion.Root defaultValue={[0]}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const trigger = screen.getByRole("button");
      const panel = screen.getByText(PANEL_CONTENT_1);

      expect(trigger).toHaveAttribute("aria-controls");
      expect(panel.getAttribute("id")).toBe(trigger.getAttribute("aria-controls"));
      expect(panel).toHaveAttribute("role", "region");
      expect(trigger.getAttribute("id")).toBe(panel.getAttribute("aria-labelledby"));
    });

    it("references manual panel id in trigger aria-controls", () => {
      render(() => (
        <Accordion.Root defaultValue={[0]}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel id="custom-panel-id">{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const trigger = screen.getByRole("button");
      const panel = screen.getByText(PANEL_CONTENT_1);

      expect(trigger).toHaveAttribute("aria-controls", "custom-panel-id");
      expect(panel).toHaveAttribute("id", "custom-panel-id");
    });

    it("references manual trigger id in panel aria-labelledby", () => {
      render(() => (
        <Accordion.Root defaultValue={[0]}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger id="custom-trigger-id">Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      expect(screen.getByText(PANEL_CONTENT_1)).toHaveAttribute(
        "aria-labelledby",
        "custom-trigger-id",
      );
    });

    it("updates panel labeling when a manual trigger id is added or changed", async () => {
      const [triggerId, setTriggerId] = createSignal<string | undefined>(undefined);
      render(() => (
        <>
          <button type="button" onClick={() => setTriggerId("custom-trigger-id-1")}>
            Set id 1
          </button>
          <button type="button" onClick={() => setTriggerId("custom-trigger-id-2")}>
            Set id 2
          </button>
          <Accordion.Root defaultValue={[0]}>
            <Accordion.Item value={0}>
              <Accordion.Header>
                <Accordion.Trigger id={triggerId()}>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>
        </>
      ));

      const trigger = screen.getByRole("button", { name: "Trigger 1" });
      const panel = screen.getByText(PANEL_CONTENT_1);

      expect(trigger).toHaveAttribute("id");
      expect(panel).toHaveAttribute("aria-labelledby", trigger.id);

      fireEvent.click(screen.getByRole("button", { name: "Set id 1" }));
      await waitFor(() => {
        expect(trigger).toHaveAttribute("id", "custom-trigger-id-1");
        expect(panel).toHaveAttribute("aria-labelledby", "custom-trigger-id-1");
      });

      fireEvent.click(screen.getByRole("button", { name: "Set id 2" }));
      await waitFor(() => {
        expect(trigger).toHaveAttribute("id", "custom-trigger-id-2");
        expect(panel).toHaveAttribute("aria-labelledby", "custom-trigger-id-2");
      });
    });

    it("restores panel labeling when a manual trigger id is removed", async () => {
      const [triggerId, setTriggerId] = createSignal<string | undefined>("custom-trigger-id");
      render(() => (
        <>
          <button type="button" onClick={() => setTriggerId(undefined)}>
            Remove id
          </button>
          <Accordion.Root defaultValue={[0]}>
            <Accordion.Item value={0}>
              <Accordion.Header>
                <Accordion.Trigger id={triggerId()}>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>
        </>
      ));

      const trigger = screen.getByRole("button", { name: "Trigger 1" });
      const panel = screen.getByText(PANEL_CONTENT_1);

      expect(panel).toHaveAttribute("aria-labelledby", "custom-trigger-id");

      fireEvent.click(screen.getByRole("button", { name: "Remove id" }));

      await waitFor(() => {
        expect(trigger).toHaveAttribute("id");
        expect(trigger).not.toHaveAttribute("id", "custom-trigger-id");
        expect(panel).toHaveAttribute("aria-labelledby", trigger.id);
      });
    });

    it("unregisters generated part ids when the trigger or panel unmounts", async () => {
      const [parts, setParts] = createSignal<"both" | "trigger" | "panel">("both");
      render(() => (
        <Accordion.Root defaultValue={[0]}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Show when={parts() !== "panel"}>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Show>
            </Accordion.Header>
            <Show when={parts() !== "trigger"}>
              <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
            </Show>
          </Accordion.Item>
        </Accordion.Root>
      ));

      setParts("panel");
      await waitFor(() => {
        expect(screen.getByText(PANEL_CONTENT_1)).not.toHaveAttribute("aria-labelledby");
      });

      setParts("both");
      await waitFor(() => {
        const trigger = screen.getByRole("button", { name: "Trigger 1" });
        expect(screen.getByText(PANEL_CONTENT_1)).toHaveAttribute("aria-labelledby", trigger.id);
      });

      setParts("trigger");
      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Trigger 1" })).not.toHaveAttribute(
          "aria-controls",
        );
      });

      setParts("both");
      await waitFor(() => {
        const trigger = screen.getByRole("button", { name: "Trigger 1" });
        const panel = screen.getByText(PANEL_CONTENT_1);
        expect(trigger).toHaveAttribute("aria-controls", panel.id);
      });
    });
  });

  describe("uncontrolled", () => {
    it("toggles the open state on click", async () => {
      render(() => (
        <Accordion.Root>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const trigger = screen.getByRole("button");

      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeNull();

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(trigger).toHaveAttribute("data-panel-open");
      expect(screen.queryByText(PANEL_CONTENT_1)).not.toBeNull();
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeVisible();
      expect(screen.queryByText(PANEL_CONTENT_1)).toHaveAttribute("data-open");

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeNull();
    });

    it("opens the defaultValue item with a custom value", () => {
      render(() => (
        <Accordion.Root defaultValue={["first"]}>
          <BasicItem value="first" label="first" panel={PANEL_CONTENT_1} />
          <BasicItem value="second" label="second" panel={PANEL_CONTENT_2} />
        </Accordion.Root>
      ));

      expect(screen.queryByText(PANEL_CONTENT_1)).not.toBeNull();
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeVisible();
      expect(screen.queryByText(PANEL_CONTENT_1)).toHaveAttribute("data-open");

      expect(screen.queryByText(PANEL_CONTENT_2)).toBeNull();
    });
  });

  describe("controlled", () => {
    it("follows the value prop", async () => {
      const [value, setValue] = createSignal<unknown[]>([]);
      render(() => (
        <Accordion.Root value={value()}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const trigger = screen.getByRole("button");

      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeNull();

      setValue([0]);
      await flushMicrotasks();

      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(trigger).toHaveAttribute("data-panel-open");
      expect(screen.queryByText(PANEL_CONTENT_1)).not.toBeNull();
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeVisible();
      expect(screen.queryByText(PANEL_CONTENT_1)).toHaveAttribute("data-open");

      setValue([]);
      await flushMicrotasks();

      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeNull();
    });

    it("opens the controlled item with a custom value", () => {
      render(() => (
        <Accordion.Root value={["one"]}>
          <BasicItem value="one" label="one" panel={PANEL_CONTENT_1} />
          <BasicItem value="second" label="second" panel={PANEL_CONTENT_2} />
        </Accordion.Root>
      ));

      expect(screen.queryByText(PANEL_CONTENT_1)).not.toBeNull();
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeVisible();
      expect(screen.queryByText(PANEL_CONTENT_1)).toHaveAttribute("data-open");

      expect(screen.queryByText(PANEL_CONTENT_2)).toBeNull();
    });
  });

  describe("prop: disabled", () => {
    it("can disable the whole accordion", () => {
      render(() => (
        <Accordion.Root defaultValue={[0]} disabled>
          <Accordion.Item data-testid="item1" value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item data-testid="item2" value={1}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const item1 = screen.getByTestId("item1");
      const panel1 = screen.queryByText(PANEL_CONTENT_1);
      const [header1, header2] = screen.getAllByRole("heading");
      const [trigger1, trigger2] = screen.getAllByRole("button");
      const item2 = screen.getByTestId("item2");

      for (const element of [item1, header1, trigger1, panel1, item2, header2, trigger2]) {
        expect(element).toHaveAttribute("data-disabled");
      }
    });

    it("can disable one accordion item", () => {
      render(() => (
        <Accordion.Root defaultValue={[0]}>
          <Accordion.Item data-testid="item1" value={0} disabled>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item data-testid="item2" value={1}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const item1 = screen.getByTestId("item1");
      const panel1 = screen.queryByText(PANEL_CONTENT_1);
      const [header1, header2] = screen.getAllByRole("heading");
      const [trigger1, trigger2] = screen.getAllByRole("button");
      const item2 = screen.getByTestId("item2");

      for (const element of [item1, header1, trigger1, panel1]) {
        expect(element).toHaveAttribute("data-disabled");
      }
      for (const element of [item2, header2, trigger2]) {
        expect(element).not.toHaveAttribute("data-disabled");
      }
    });

    it.each(["root", "item"] as const)(
      "does not toggle or fire callbacks when the %s is disabled",
      async (disabledPart) => {
        const onValueChange = vi.fn();
        const onOpenChange = vi.fn();

        render(() => (
          <Accordion.Root disabled={disabledPart === "root"} onValueChange={onValueChange}>
            <Accordion.Item
              value={0}
              disabled={disabledPart === "item"}
              onOpenChange={onOpenChange}
            >
              <Accordion.Header>
                <Accordion.Trigger disabled={false}>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
            </Accordion.Item>
            <Accordion.Item value={1} onOpenChange={onOpenChange}>
              <Accordion.Header>
                <Accordion.Trigger disabled={false}>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>
        ));

        const [trigger1] = screen.getAllByRole("button");

        fireEvent.click(trigger1);
        await flushMicrotasks();
        fireEvent.keyDown(trigger1, { key: "Enter" });
        await flushMicrotasks();

        expect(trigger1).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByText(PANEL_CONTENT_1)).toBeNull();
        expect(onValueChange).not.toHaveBeenCalled();
        expect(onOpenChange).not.toHaveBeenCalled();
      },
    );
  });

  it("allows onMouseUp to call preventBaseUIHandler on the trigger", () => {
    render(() => (
      <Accordion.Root>
        <Accordion.Item value={0}>
          <Accordion.Header>
            <Accordion.Trigger
              onMouseUp={(event: MouseEvent & { preventBaseUIHandler?: () => void }) =>
                event.preventBaseUIHandler?.()
              }
            >
              Trigger 1
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
        </Accordion.Item>
      </Accordion.Root>
    ));

    expect(() =>
      fireEvent.mouseUp(screen.getByRole("button", { name: "Trigger 1" })),
    ).not.toThrow();
  });

  describe("keyboard interactions", () => {
    it.each([true, false])("Enter and Space toggle a %s trigger", async (nativeButton) => {
      render(() => (
        <Accordion.Root>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger
                nativeButton={nativeButton}
                render={nativeButton ? undefined : "span"}
              >
                Trigger 1
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const trigger = screen.getByRole("button");
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeNull();

      // Native buttons rely on the browser to synthesize activation on keyup, which
      // synthetic test events cannot reproduce, so only the non-native path is asserted
      // here. Native activation is covered by the click tests above.
      if (!nativeButton) {
        fireEvent.keyDown(trigger, { key: "Enter" });
        await flushMicrotasks();
        expect(trigger).toHaveAttribute("aria-expanded", "true");
        expect(screen.queryByText(PANEL_CONTENT_1)).toHaveAttribute("data-open");

        fireEvent.keyUp(trigger, { key: " " });
        await flushMicrotasks();
        expect(trigger).toHaveAttribute("aria-expanded", "false");
        expect(screen.queryByText(PANEL_CONTENT_1)).toBeNull();
      } else {
        fireEvent.keyDown(trigger, { key: "Enter" });
        await flushMicrotasks();
        // The keydown alone must not toggle a native button; activation happens on keyup.
        expect(trigger).toHaveAttribute("aria-expanded", "false");
      }
    });

    it("opens and closes on Space keyup without toggling on keydown", async () => {
      const onOpenChange = vi.fn();

      render(() => (
        <Accordion.Root>
          <Accordion.Item onOpenChange={onOpenChange}>
            <Accordion.Header>
              <Accordion.Trigger nativeButton={false} render="span">
                Trigger 1
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const trigger = screen.getByRole("button");

      fireEvent.keyDown(trigger, { key: " " });
      await flushMicrotasks();
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeNull();
      expect(onOpenChange).not.toHaveBeenCalled();

      fireEvent.keyUp(trigger, { key: " " });
      await flushMicrotasks();
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText(PANEL_CONTENT_1)).toBeInTheDocument();
      expect(onOpenChange).toHaveBeenCalledTimes(1);
      expect(onOpenChange).toHaveBeenLastCalledWith(true, expect.anything());

      fireEvent.keyDown(trigger, { key: " " });
      await flushMicrotasks();
      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText(PANEL_CONTENT_1)).toBeInTheDocument();
      expect(onOpenChange).toHaveBeenCalledTimes(1);

      fireEvent.keyUp(trigger, { key: " " });
      await flushMicrotasks();
      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeNull();
      expect(onOpenChange).toHaveBeenCalledTimes(2);
      expect(onOpenChange).toHaveBeenLastCalledWith(false, expect.anything());
    });
  });

  describe("BaseUIChangeEventDetails", () => {
    it("onOpenChange cancel() prevents opening while uncontrolled", async () => {
      const onValueChange = vi.fn();

      render(() => (
        <Accordion.Root onValueChange={onValueChange}>
          <Accordion.Item
            value={0}
            onOpenChange={(nextOpen, eventDetails) => {
              if (nextOpen) {
                eventDetails.cancel();
              }
            }}
          >
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const trigger = screen.getByRole("button");

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeNull();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("onValueChange cancel() prevents opening while uncontrolled", async () => {
      const onValueChange = vi.fn((_value, eventDetails) => {
        eventDetails.cancel();
      });

      render(() => (
        <Accordion.Root onValueChange={onValueChange}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const trigger = screen.getByRole("button");

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeNull();
      expect(onValueChange).toHaveBeenCalledTimes(1);
    });

    it("onValueChange cancel() prevents closing while uncontrolled", async () => {
      const onValueChange = vi.fn((_value, eventDetails) => {
        eventDetails.cancel();
      });

      render(() => (
        <Accordion.Root defaultValue={[0]} onValueChange={onValueChange}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const trigger = screen.getByRole("button");

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(screen.getByText(PANEL_CONTENT_1)).toHaveAttribute("data-open");
      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange.mock.lastCall?.[0]).toEqual([]);
    });

    it("onOpenChange cancel() prevents onValueChange while controlled", async () => {
      const onValueChange = vi.fn();

      render(() => (
        <Accordion.Root value={[]} onValueChange={onValueChange}>
          <Accordion.Item
            value={0}
            onOpenChange={(nextOpen, eventDetails) => {
              if (nextOpen) {
                eventDetails.cancel();
              }
            }}
          >
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const trigger = screen.getByRole("button");

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeNull();
      expect(onValueChange).not.toHaveBeenCalled();
    });

    it("onValueChange cancel() prevents opening while controlled", async () => {
      const onValueChange = vi.fn();
      const [value, setValue] = createSignal<unknown[]>([]);

      render(() => (
        <Accordion.Root
          value={value()}
          onValueChange={(nextValue, eventDetails) => {
            onValueChange(nextValue, eventDetails);
            eventDetails.cancel();
            if (!eventDetails.isCanceled) {
              setValue(nextValue);
            }
          }}
        >
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const trigger = screen.getByRole("button");

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeNull();
      expect(onValueChange).toHaveBeenCalledTimes(1);
    });

    it("onValueChange cancel() prevents opening while multiple", async () => {
      const onValueChange = vi.fn((_value, eventDetails) => {
        eventDetails.cancel();
      });

      render(() => (
        <Accordion.Root multiple onValueChange={onValueChange}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const trigger = screen.getByRole("button");

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(trigger).toHaveAttribute("aria-expanded", "false");
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeNull();
      expect(onValueChange).toHaveBeenCalledTimes(1);
    });

    it("onValueChange cancel() prevents closing while multiple", async () => {
      const onValueChange = vi.fn((_value, eventDetails) => {
        eventDetails.cancel();
      });

      render(() => (
        <Accordion.Root defaultValue={[0]} multiple onValueChange={onValueChange}>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const trigger = screen.getByRole("button");

      fireEvent.click(trigger);
      await flushMicrotasks();

      expect(trigger).toHaveAttribute("aria-expanded", "true");
      expect(screen.queryByText(PANEL_CONTENT_1)).not.toBeNull();
      expect(onValueChange).toHaveBeenCalledTimes(1);
    });
  });

  describe("prop: multiple", () => {
    it("multiple items can be open when `multiple = true`", async () => {
      render(() => (
        <Accordion.Root multiple>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const [trigger1, trigger2] = screen.getAllByRole("button");

      expect(trigger1).not.toHaveAttribute("data-panel-open");
      expect(trigger2).not.toHaveAttribute("data-panel-open");
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeNull();
      expect(screen.queryByText(PANEL_CONTENT_2)).toBeNull();

      fireEvent.click(trigger1);
      await flushMicrotasks();
      fireEvent.click(trigger2);
      await flushMicrotasks();

      expect(screen.queryByText(PANEL_CONTENT_1)).toHaveAttribute("data-open");
      expect(screen.queryByText(PANEL_CONTENT_2)).toHaveAttribute("data-open");
      expect(trigger1).toHaveAttribute("data-panel-open");
      expect(trigger2).toHaveAttribute("data-panel-open");

      fireEvent.click(trigger1);
      await flushMicrotasks();

      expect(screen.queryByText(PANEL_CONTENT_1)).toBeNull();
      expect(screen.getByText(PANEL_CONTENT_2)).toHaveAttribute("data-open");
      expect(trigger1).not.toHaveAttribute("data-panel-open");
      expect(trigger2).toHaveAttribute("data-panel-open");
    });

    it("when false only one item can be open", async () => {
      render(() => (
        <Accordion.Root multiple={false}>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_1}</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>{PANEL_CONTENT_2}</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const [trigger1, trigger2] = screen.getAllByRole("button");

      expect(screen.queryByText(PANEL_CONTENT_1)).toBeNull();
      expect(screen.queryByText(PANEL_CONTENT_2)).toBeNull();
      expect(trigger1).not.toHaveAttribute("data-panel-open");
      expect(trigger2).not.toHaveAttribute("data-panel-open");

      fireEvent.click(trigger1);
      await flushMicrotasks();

      expect(screen.queryByText(PANEL_CONTENT_1)).toHaveAttribute("data-open");
      expect(trigger1).toHaveAttribute("data-panel-open");

      fireEvent.click(trigger2);
      await flushMicrotasks();

      expect(screen.queryByText(PANEL_CONTENT_2)).toHaveAttribute("data-open");
      expect(trigger2).toHaveAttribute("data-panel-open");
      expect(screen.queryByText(PANEL_CONTENT_1)).toBeNull();
      expect(trigger1).not.toHaveAttribute("data-panel-open");
    });
  });

  describe("prop: onValueChange", () => {
    it("reports string values when multiple", async () => {
      const onValueChange = vi.fn();

      render(() => (
        <Accordion.Root onValueChange={onValueChange} multiple>
          <Accordion.Item value={0}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value={1}>
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const [trigger1, trigger2] = screen.getAllByRole("button");

      expect(onValueChange).not.toHaveBeenCalled();

      fireEvent.click(trigger1);
      await flushMicrotasks();

      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange.mock.lastCall?.[0]).toEqual([0]);
      expect(onValueChange.mock.lastCall?.[1].reason).toBe(REASONS.triggerPress);
      expect(onValueChange.mock.lastCall?.[1].event.type).not.toBe("base-ui");

      fireEvent.click(trigger2);
      await flushMicrotasks();

      expect(onValueChange).toHaveBeenCalledTimes(2);
      expect(onValueChange.mock.lastCall?.[0]).toEqual([0, 1]);
      expect(onValueChange.mock.lastCall?.[1].reason).toBe(REASONS.triggerPress);
      expect(onValueChange.mock.lastCall?.[1].event.type).not.toBe("base-ui");
    });

    it("reports custom item values in open order", async () => {
      const onValueChange = vi.fn();

      render(() => (
        <Accordion.Root onValueChange={onValueChange} multiple>
          <Accordion.Item value="one">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="two">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const [trigger1, trigger2] = screen.getAllByRole("button");

      expect(onValueChange).not.toHaveBeenCalled();

      fireEvent.click(trigger2);
      await flushMicrotasks();

      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange.mock.calls[0][0]).toEqual(["two"]);

      fireEvent.click(trigger1);
      await flushMicrotasks();

      expect(onValueChange).toHaveBeenCalledTimes(2);
      expect(onValueChange.mock.calls[1][0]).toEqual(["two", "one"]);
    });

    it("replaces the value when `multiple` is false", async () => {
      const onValueChange = vi.fn();

      render(() => (
        <Accordion.Root onValueChange={onValueChange} multiple={false}>
          <Accordion.Item value="one">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 1</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>1</Accordion.Panel>
          </Accordion.Item>
          <Accordion.Item value="two">
            <Accordion.Header>
              <Accordion.Trigger>Trigger 2</Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel>2</Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      ));

      const [trigger1, trigger2] = screen.getAllByRole("button");

      expect(onValueChange).not.toHaveBeenCalled();

      fireEvent.click(trigger1);
      await flushMicrotasks();

      expect(onValueChange).toHaveBeenCalledTimes(1);
      expect(onValueChange.mock.calls[0][0]).toEqual(["one"]);

      fireEvent.click(trigger2);
      await flushMicrotasks();

      expect(onValueChange).toHaveBeenCalledTimes(2);
      expect(onValueChange.mock.calls[1][0]).toEqual(["two"]);
    });
  });

  it.skipIf(isJSDOM)(
    "drops the closing panel only after its exit transition finishes",
    async () => {
      render(() => (
        <>
          <style>{`
          .transition-test-panel {
            overflow: hidden;
            height: var(--accordion-panel-height);
            transition: height 300ms linear;
          }

          .transition-test-panel[data-starting-style],
          .transition-test-panel[data-ending-style] {
            height: 0;
          }
        `}</style>

          <Accordion.Root defaultValue={[0]} multiple={false}>
            <Accordion.Item value={0}>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 1</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel class="transition-test-panel" data-testid="panel-1" keepMounted>
                First panel
              </Accordion.Panel>
            </Accordion.Item>

            <Accordion.Item value={1}>
              <Accordion.Header>
                <Accordion.Trigger>Trigger 2</Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Panel class="transition-test-panel" data-testid="panel-2" keepMounted>
                Second panel
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion.Root>
        </>
      ));

      const trigger2 = screen.getByRole("button", { name: "Trigger 2" });
      const panel1 = screen.getByTestId("panel-1");
      const panel2 = screen.getByTestId("panel-2");

      await waitFor(() => {
        expect(panel1).toHaveAttribute("data-open");
        expect(panel1.style.getPropertyValue("--accordion-panel-height")).toBe("auto");
      });

      fireEvent.click(trigger2);

      await waitFor(() => {
        expect(panel1).toHaveAttribute("data-ending-style");
        expect(panel1).not.toHaveAttribute("hidden");
        expect(panel1.style.getPropertyValue("--accordion-panel-height")).toMatch(/px$/);
        expect(panel2).toHaveAttribute("data-open");
      });

      await waitFor(
        () => {
          expect(panel1).toHaveAttribute("hidden");
          expect(panel2).not.toHaveAttribute("hidden");
        },
        { timeout: 2000 },
      );
    },
  );
});
