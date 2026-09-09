import { createSignal } from "solid-js";
import { fireEvent, screen } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import { render, flushMicrotasks } from "../../../test/test-utils";
import { Progress } from "../index";
import type { ProgressRoot } from "./ProgressRoot";
function formatPercent(value: number) {
  return value.toLocaleString(undefined, { style: "percent" });
}

function TestProgress(props: ProgressRoot.Props) {
  return (
    <Progress.Root {...props}>
      <Progress.Label data-testid="label">Upload progress</Progress.Label>
      <Progress.Value data-testid="value" />
      <Progress.Track data-testid="track">
        <Progress.Indicator data-testid="indicator" />
      </Progress.Track>
    </Progress.Root>
  );
}

describe("<Progress.Root />", () => {
  it("forwards props, class, style, ref, events, and render props", () => {
    let ref: HTMLElement | undefined;
    const onClick = vi.fn();
    render(() => (
      <Progress.Root value={30}>
        <Progress.Root
          value={30}
          data-testid="part"
          id="custom"
          class={() => "custom"}
          style={() => ({ color: "red" })}
          ref={(element) => {
            ref = element;
          }}
          onClick={onClick}
          render={(props, state) => <section {...props} data-status={state.status} />}
        />
      </Progress.Root>
    ));
    const element = screen.getByTestId("part");
    expect(element.tagName).toBe("SECTION");
    expect(element).toHaveAttribute("id", "custom");
    expect(element).toHaveClass("custom");
    expect(element.style.color).toBe("red");
    expect(element).toHaveAttribute("data-status", "progressing");
    expect(ref).toBe(element);
    fireEvent.click(element);
    expect(onClick).toHaveBeenCalledOnce();
  });

  describe("ARIA attributes", () => {
    it("sets the correct aria attributes", async () => {
      render(() => (
        <Progress.Root value={30}>
          <Progress.Label>Downloading</Progress.Label>
          <Progress.Value />
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>
      ));

      const progressbar = screen.getByRole("progressbar");
      const label = screen.getByText("Downloading");

      expect(progressbar).toHaveAttribute("aria-valuenow", "30");
      expect(progressbar).toHaveAttribute("aria-valuemin", "0");
      expect(progressbar).toHaveAttribute("aria-valuemax", "100");
      expect(progressbar).toHaveAttribute(
        "aria-valuetext",
        (0.3).toLocaleString(undefined, { style: "percent" }),
      );
      expect(progressbar.getAttribute("aria-labelledby")).toBe(label.getAttribute("id"));
    });

    it("should update aria-valuenow when value changes", async () => {
      const [props, setProps] = createSignal<ProgressRoot.Props>({ value: 50 });
      render(() => <TestProgress {...props()} />);
      const progressbar = screen.getByRole("progressbar");
      setProps((previous) => ({ ...previous, value: 77 }));
      await flushMicrotasks();
      expect(progressbar).toHaveAttribute("aria-valuenow", "77");
    });
  });

  describe("data attributes", () => {
    it("keeps every composed part synchronized through the status cycle", async () => {
      const [props, setProps] = createSignal<ProgressRoot.Props>({ value: null });
      render(() => <TestProgress {...props()} />);
      const progressbar = screen.getByRole("progressbar");
      const value = screen.getByTestId("value");
      const indicator = screen.getByTestId("indicator");
      const parts = [
        progressbar,
        screen.getByTestId("label"),
        value,
        screen.getByTestId("track"),
        indicator,
      ];

      parts.forEach((part) => {
        expect(part).toHaveAttribute("data-indeterminate");
        expect(part).not.toHaveAttribute("data-progressing");
        expect(part).not.toHaveAttribute("data-complete");
      });
      expect(progressbar).not.toHaveAttribute("aria-valuenow");
      expect(progressbar).toHaveAttribute("aria-valuetext", "indeterminate progress");
      expect(value).toBeEmptyDOMElement();
      expect(indicator.style.width).toBe("");

      setProps((previous) => ({ ...previous, value: 50 }));
      await flushMicrotasks();
      parts.forEach((part) => {
        expect(part).not.toHaveAttribute("data-indeterminate");
        expect(part).toHaveAttribute("data-progressing");
        expect(part).not.toHaveAttribute("data-complete");
      });
      expect(progressbar).toHaveAttribute("aria-valuenow", "50");
      expect(value.textContent).toBe(formatPercent(0.5));
      expect(indicator.style.width).toBe("50%");

      setProps((previous) => ({ ...previous, value: 100 }));
      await flushMicrotasks();
      parts.forEach((part) => {
        expect(part).not.toHaveAttribute("data-indeterminate");
        expect(part).not.toHaveAttribute("data-progressing");
        expect(part).toHaveAttribute("data-complete");
      });
      expect(progressbar).toHaveAttribute("aria-valuenow", "100");
      expect(value.textContent).toBe(formatPercent(1));
      expect(indicator.style.width).toBe("100%");

      setProps((previous) => ({ ...previous, value: null }));
      await flushMicrotasks();
      parts.forEach((part) => {
        expect(part).toHaveAttribute("data-indeterminate");
        expect(part).not.toHaveAttribute("data-progressing");
        expect(part).not.toHaveAttribute("data-complete");
      });
      expect(progressbar).not.toHaveAttribute("aria-valuenow");
      expect(progressbar).toHaveAttribute("aria-valuetext", "indeterminate progress");
      expect(value).toBeEmptyDOMElement();
      expect(indicator.style.width).toBe("");
    });
  });

  describe("range", () => {
    it("normalizes the formatted value, aria-valuetext, and indicator within a custom range", async () => {
      const expected = (0.5).toLocaleString(undefined, { style: "percent" });

      render(() => (
        <Progress.Root min={20} max={40} value={30}>
          <Progress.Value data-testid="value" />
          <Progress.Track>
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>
      ));

      const progressbar = screen.getByRole("progressbar");
      expect(screen.getByTestId("indicator").style.width).toBe("50%");
      expect(screen.getByTestId("value").textContent).toBe(expected);
      expect(progressbar).toHaveAttribute("aria-valuetext", expected);
    });

    it("clamps aria-valuenow, the value text, and the indicator when the value overshoots max", async () => {
      const expected = (1).toLocaleString(undefined, { style: "percent" });

      render(() => (
        <Progress.Root min={0} max={40} value={50}>
          <Progress.Value data-testid="value" />
          <Progress.Track>
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>
      ));

      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "40");
      expect(progressbar).toHaveAttribute("aria-valuemax", "40");
      expect(progressbar).toHaveAttribute("aria-valuetext", expected);
      expect(screen.getByTestId("value").textContent).toBe(expected);
      expect(screen.getByTestId("indicator").style.width).toBe("100%");
    });

    it("clamps aria-valuenow, the value text, and the indicator when the value undershoots min", async () => {
      const expected = (0).toLocaleString(undefined, { style: "percent" });

      render(() => (
        <Progress.Root min={20} max={40} value={10}>
          <Progress.Value data-testid="value" />
          <Progress.Track>
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>
      ));

      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "20");
      expect(progressbar).toHaveAttribute("aria-valuemin", "20");
      expect(progressbar).toHaveAttribute("aria-valuetext", expected);
      expect(screen.getByTestId("value").textContent).toBe(expected);
      expect(screen.getByTestId("indicator").style.width).toBe("0%");
    });

    it.each([
      { value: 50, expectedValue: 40 },
      { value: 10, expectedValue: 20 },
    ])(
      "formats the clamped value $expectedValue when a custom-formatted value $value is outside the range",
      async ({ value, expectedValue }) => {
        const format: Intl.NumberFormatOptions = {
          style: "currency",
          currency: "USD",
        };
        const expected = new Intl.NumberFormat(undefined, format).format(expectedValue);
        const getAriaValueText = vi.fn((formattedValue: string, rawValue: number | null) => {
          return `${formattedValue} (raw: ${rawValue})`;
        });

        render(() => (
          <Progress.Root
            min={20}
            max={40}
            value={value}
            format={format}
            getAriaValueText={getAriaValueText}
          >
            <Progress.Value data-testid="value" />
          </Progress.Root>
        ));

        const progressbar = screen.getByRole("progressbar");
        expect(progressbar).toHaveAttribute("aria-valuenow", String(expectedValue));
        expect(screen.getByTestId("value")).toHaveTextContent(expected);
        expect(getAriaValueText).toHaveBeenLastCalledWith(expected, value);
        expect(progressbar).toHaveAttribute("aria-valuetext", `${expected} (raw: ${value})`);
      },
    );

    it("reports complete when the value reaches or exceeds max", async () => {
      render(() => (
        <Progress.Root min={0} max={40} value={45}>
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>
      ));

      expect(screen.getByRole("progressbar")).toHaveAttribute("data-complete");
    });

    it("normalizes aria attributes when min equals max", async () => {
      const expected = (0).toLocaleString(undefined, { style: "percent" });

      render(() => (
        <Progress.Root min={5} max={5} value={5}>
          <Progress.Value data-testid="value" />
          <Progress.Track>
            <Progress.Indicator data-testid="indicator" />
          </Progress.Track>
        </Progress.Root>
      ));

      const progressbar = screen.getByRole("progressbar");
      expect(progressbar).toHaveAttribute("aria-valuenow", "5");
      expect(progressbar).toHaveAttribute("aria-valuetext", expected);
      expect(screen.getByTestId("value").textContent).toBe(expected);
      expect(screen.getByTestId("indicator").style.width).toBe("0%");
    });

    it.each([Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY])(
      "keeps non-finite value %s indeterminate",
      async (value) => {
        render(() => <TestProgress value={value} />);

        const progressbar = screen.getByRole("progressbar");
        expect(progressbar).toHaveAttribute("data-indeterminate");
        expect(progressbar).not.toHaveAttribute("aria-valuenow");
        expect(progressbar).toHaveAttribute("aria-valuetext", "indeterminate progress");
        expect(screen.getByTestId("value")).toBeEmptyDOMElement();
        expect(screen.getByTestId("indicator").style.width).toBe("");
      },
    );
  });

  describe("prop: getAriaValueText", () => {
    it("receives the formatted and raw values for determinate and indeterminate states", async () => {
      const getAriaValueText = vi.fn((formattedValue: string | null, value: number | null) =>
        value == null ? "Waiting to start" : `${formattedValue} uploaded`,
      );

      const [props, setProps] = createSignal<ProgressRoot.Props>({ value: 30 });
      render(() => (
        <Progress.Root {...props()} getAriaValueText={getAriaValueText}>
          <Progress.Value data-testid="value" />
        </Progress.Root>
      ));

      const progressbar = screen.getByRole("progressbar");
      const formattedValue = formatPercent(0.3);
      expect(getAriaValueText).toHaveBeenLastCalledWith(formattedValue, 30);
      expect(progressbar).toHaveAttribute("aria-valuetext", `${formattedValue} uploaded`);
      expect(screen.getByTestId("value").textContent).toBe(formattedValue);

      setProps((previous) => ({ ...previous, value: null }));
      await flushMicrotasks();

      expect(getAriaValueText).toHaveBeenLastCalledWith("", null);
      expect(progressbar).toHaveAttribute("aria-valuetext", "Waiting to start");
      expect(screen.getByTestId("value")).toBeEmptyDOMElement();
    });
  });

  describe("prop: format", () => {
    it("formats the value", async () => {
      const format: Intl.NumberFormatOptions = {
        style: "currency",
        currency: "USD",
      };
      function formatValue(v: number) {
        return new Intl.NumberFormat(undefined, format).format(v);
      }

      render(() => (
        <Progress.Root value={30} format={format}>
          <Progress.Value data-testid="value" />
          <Progress.Track>
            <Progress.Indicator />
          </Progress.Track>
        </Progress.Root>
      ));

      const value = screen.getByTestId("value");
      const progressbar = screen.getByRole("progressbar");
      expect(value.textContent).toBe(formatValue(30));
      expect(progressbar).toHaveAttribute("aria-valuetext", formatValue(30));
    });

    it("reflects format changes without lagging a commit", async () => {
      const usd: Intl.NumberFormatOptions = { style: "currency", currency: "USD" };
      const eur: Intl.NumberFormatOptions = { style: "currency", currency: "EUR" };
      function formatValue(v: number, options: Intl.NumberFormatOptions) {
        return new Intl.NumberFormat(undefined, options).format(v);
      }

      const [props, setProps] = createSignal<ProgressRoot.Props>({ value: 30, format: usd });
      render(() => (
        <Progress.Root {...props()}>
          <Progress.Value data-testid="value" />
        </Progress.Root>
      ));

      const value = screen.getByTestId("value");
      expect(value.textContent).toBe(formatValue(30, usd));

      setProps((previous) => ({ ...previous, format: eur }));
      await flushMicrotasks();
      expect(value.textContent).toBe(formatValue(30, eur));
    });
  });

  describe("prop: locale", () => {
    it("sets the locale when formatting the value", async () => {
      // In German locale, numbers use dot as thousands separator and comma as decimal separator
      const expectedValue = new Intl.NumberFormat("de-DE").format(70.51);

      render(() => (
        <Progress.Root
          value={70.51}
          format={{
            style: "decimal",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }}
          locale="de-DE"
        >
          <Progress.Value data-testid="value" />
        </Progress.Root>
      ));

      expect(screen.getByTestId("value")).toHaveTextContent(expectedValue);
    });
  });
});

describe("Solid reactivity", () => {
  it.each([Progress.Root, Progress.Label, Progress.Track, Progress.Indicator, Progress.Value])(
    "keeps class, style, and render state live on %s",
    async (Part) => {
      const [value, setValue] = createSignal<number | null>(null);
      render(() => (
        <Progress.Root value={value()}>
          <Part
            value={value()}
            data-testid="part"
            class={(state) => state.status}
            style={(state) => ({ color: state.status === "complete" ? "green" : "red" })}
            render={(props, state) => <section {...props} data-status={state.status} />}
          />
        </Progress.Root>
      ));
      const part = screen.getByTestId("part");
      for (const step of [
        { value: 30, status: "progressing" },
        { value: 100, status: "complete" },
        { value: null, status: "indeterminate" },
      ]) {
        setValue(step.value);
        await flushMicrotasks();
        expect(screen.getByTestId("part")).toBe(part);
        expect(part).toHaveClass(step.status);
        expect(part).toHaveAttribute("data-status", step.status);
        expect(part).toHaveAttribute(`data-${step.status}`);
        expect(part.style.color).toBe(step.status === "complete" ? "green" : "red");
      }
    },
  );

  it("updates range and locale without replacing the progress bar", async () => {
    const [props, setProps] = createSignal({ min: 10, max: 30, value: 20, locale: "en-US" });
    render(() => <TestProgress {...props()} />);
    const root = screen.getByRole("progressbar");
    setProps({ min: 20, max: 60, value: 50, locale: "de-DE" });
    await flushMicrotasks();
    expect(screen.getByRole("progressbar")).toBe(root);
    expect(root).toHaveAttribute("aria-valuemin", "20");
    expect(root).toHaveAttribute("aria-valuemax", "60");
    expect(root).toHaveAttribute("aria-valuenow", "50");
    const formatted = new Intl.NumberFormat("de-DE", { style: "percent" }).format(0.75);
    expect(root).toHaveAttribute("aria-valuetext", formatted);
    expect(screen.getByTestId("value").textContent).toBe(formatted);
    expect(screen.getByTestId("indicator").style.width).toBe("75%");
    for (const name of ["value", "min", "max", "locale", "format", "getAriaValueText"])
      expect(root).not.toHaveAttribute(name);
  });

  it("preserves explicit accessible text and the NVDA label workaround", () => {
    render(() => (
      <Progress.Root value={30} aria-label="Upload" aria-valuetext="Almost there">
        <Progress.Value data-testid="value" />
      </Progress.Root>
    ));
    const root = screen.getByRole("progressbar", { name: "Upload" });
    expect(root).toHaveAttribute("aria-valuetext", "Almost there");
    expect(screen.getByTestId("value")).toHaveAttribute("aria-hidden", "true");
    expect(root.querySelector('[role="presentation"]')).toHaveTextContent("x");
  });
});
