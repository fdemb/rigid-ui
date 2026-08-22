import { createSignal } from "solid-js";
import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vite-plus/test";
import type { StateAttributesMapping } from "./getStateAttributesProps";
import { renderElement } from "./renderElement";

/**
 * Behavioral contracts for the Solid replacement of Base UI's `useRenderElement`.
 * Base UI's hook returns a React element; ours returns a prop bag for spreading onto a
 * static tag so the Solid compiler keeps its template optimizations.
 */

describe("renderElement", () => {
  it("spreads user props and internal props onto the element", () => {
    const { container } = render(() => {
      const Button = (props: Record<string, unknown>) => (
        <button {...renderElement<HTMLButtonElement>(props, { props: [{ type: "button" }] })} />
      );
      return <Button id="x" title="hello" />;
    });

    const button = container.firstElementChild as HTMLButtonElement;
    expect(button.id).toBe("x");
    expect(button.title).toBe("hello");
  });

  it("lets user props override internal props", () => {
    const { container } = render(() => {
      const Button = (props: Record<string, unknown>) => (
        <button {...renderElement<HTMLButtonElement>(props, { props: [{ type: "button" }] })} />
      );
      return <Button type="submit" />;
    });

    expect((container.firstElementChild as HTMLButtonElement).type).toBe("submit");
  });

  it("strips excluded component props and children/ref from the DOM", () => {
    const { container } = render(() => {
      const Trigger = (props: Record<string, unknown>) => (
        <button {...renderElement<HTMLButtonElement>(props, { exclude: ["open"] })}>label</button>
      );
      return <Trigger open="yes" data-keep="1" />;
    });

    const button = container.firstElementChild as HTMLElement;
    expect(button.hasAttribute("open")).toBe(false);
    expect(button.getAttribute("data-keep")).toBe("1");
    expect(button.textContent).toContain("label");
  });

  it("resolves function-form class against state and concatenates external class first", async () => {
    const [open, setOpen] = createSignal(false);
    const { container } = render(() => {
      const Div = (props: Record<string, unknown>) => (
        <div
          {...renderElement<HTMLDivElement>(props, {
            state: () => ({ open: open() }),
            props: [{ class: "internal" }],
          })}
        />
      );
      return <Div class={(state: { open: boolean }) => (state.open ? "is-open" : "is-closed")} />;
    });

    const div = container.firstElementChild as HTMLElement;
    // Rightmost (external/user) class appears first, matching Base UI's mergeClassNames.
    expect(div.className).toBe("is-closed internal");

    setOpen(true);
    await Promise.resolve();
    expect(div.className).toBe("is-open internal");
  });

  it("keeps every other user prop when class or style resolution is active", () => {
    const { container } = render(() => {
      const Div = (props: Record<string, unknown>) => (
        <div
          {...renderElement<HTMLDivElement>(props, {
            state: { open: true },
            props: [{ class: "internal" }],
          })}
        />
      );
      return <Div class="static" data-testid="probe" onClick={() => {}} />;
    });

    const div = container.firstElementChild as HTMLElement;
    expect(div.className).toBe("static internal");
    expect(div.getAttribute("data-testid")).toBe("probe");
  });

  it("merges object styles and resolves function-form styles against state", async () => {
    const [wide, setWide] = createSignal(false);
    const { container } = render(() => {
      const Div = (props: Record<string, unknown>) => (
        <div
          {...renderElement<HTMLDivElement>(props, {
            state: () => ({ wide: wide() }),
            props: [{ style: { color: "red" } }],
          })}
        />
      );
      return (
        <Div style={(state: { wide: boolean }) => ({ width: state.wide ? "100px" : "10px" })} />
      );
    });

    const div = container.firstElementChild as HTMLElement;
    expect(div.style.color).toBe("red");
    expect(div.style.width).toBe("10px");

    setWide(true);
    await Promise.resolve();
    expect(div.style.width).toBe("100px");
  });

  it("renders state as data attributes with the default rules", () => {
    const { container } = render(() => {
      const Div = (props: Record<string, unknown>) => (
        <div
          {...renderElement<HTMLDivElement>(props, {
            state: { open: true, disabled: false, orientation: "horizontal" },
          })}
        />
      );
      return <Div />;
    });

    const div = container.firstElementChild as HTMLElement;
    expect(div.hasAttribute("data-open")).toBe(true);
    expect(div.getAttribute("data-open")).toBe("");
    expect(div.hasAttribute("data-disabled")).toBe(false);
    expect(div.getAttribute("data-orientation")).toBe("horizontal");
  });

  it("switches mapped attribute names reactively when state changes", async () => {
    const [status, setStatus] = createSignal<string | undefined>("starting");
    const mapping: StateAttributesMapping<{ transitionStatus: string | undefined }> = {
      transitionStatus(value: string | undefined): Record<string, string> | null {
        if (value === "starting") return { "data-starting-style": "" };
        if (value === "ending") return { "data-ending-style": "" };
        return null;
      },
    };

    const { container } = render(() => {
      const Div = (props: Record<string, unknown>) => (
        <div
          {...renderElement<HTMLDivElement, { transitionStatus: string | undefined }>(props, {
            state: () => ({ transitionStatus: status() }),
            stateAttributesMapping: mapping,
          })}
        />
      );
      return <Div />;
    });

    const div = container.firstElementChild as HTMLElement;
    expect(div.hasAttribute("data-starting-style")).toBe(true);

    setStatus(undefined);
    await Promise.resolve();
    expect(div.hasAttribute("data-starting-style")).toBe(false);
    expect(div.hasAttribute("data-ending-style")).toBe(false);

    setStatus("ending");
    await Promise.resolve();
    expect(div.hasAttribute("data-ending-style")).toBe(true);
  });

  it("chains user handler before internal handler", () => {
    const log: string[] = [];
    const { container } = render(() => {
      const Button = (props: Record<string, unknown>) => (
        <button
          {...renderElement<HTMLButtonElement>(props, {
            props: [
              {
                onClick() {
                  log.push("internal");
                },
              },
            ],
          })}
        />
      );
      return <Button onClick={() => log.push("user")} />;
    });

    fireEvent.click(container.firstElementChild as HTMLElement);
    expect(log).toEqual(["user", "internal"]);
  });

  it("skips the internal handler when the user handler calls preventBaseUIHandler", () => {
    const log: string[] = [];
    const { container } = render(() => {
      const Button = (props: Record<string, unknown>) => (
        <button
          {...renderElement<HTMLButtonElement>(props, {
            props: [
              {
                onClick() {
                  log.push("internal");
                },
              },
            ],
          })}
        />
      );
      return (
        <Button
          onClick={(event: MouseEvent & { preventBaseUIHandler(): void }) => {
            event.preventBaseUIHandler();
            log.push("user");
          }}
        />
      );
    });

    fireEvent.click(container.firstElementChild as HTMLElement);
    expect(log).toEqual(["user"]);
  });

  it("composes internal refs before the user ref", () => {
    const internalOrder: string[] = [];
    const userOrder: string[] = [];
    let internalElement: HTMLElement | undefined;

    const { container } = render(() => {
      const Div = (props: Record<string, unknown>) => (
        <div
          {...renderElement<HTMLDivElement>(props, {
            ref: [
              (element: HTMLDivElement) => {
                internalElement = element;
                internalOrder.push("internal");
              },
            ],
          })}
        />
      );
      return <Div ref={(element: HTMLElement) => userOrder.push(element.tagName)} />;
    });

    expect(internalElement).toBe(container.firstElementChild);
    expect(internalOrder).toEqual(["internal"]);
    expect(userOrder).toEqual(["DIV"]);
  });
});
