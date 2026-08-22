import { describe, expect, it, vi } from "vite-plus/test";
import { makeEventPreventable, mergeClassNames, mergeProps, mergePropsN } from "./mergeProps";
import type { BaseUIHandledEvent } from "./mergeProps";

/**
 * Ports of `reference/base-ui/packages/react/src/merge-props/mergeProps.test.ts`.
 * React synthetic events are replaced with native DOM events; the prevention
 * protocol attaches directly to the event object instead of a wrapper.
 */

function clickEvent() {
  const event = new MouseEvent("click", { bubbles: true, cancelable: true });
  makeEventPreventable(event);
  return event;
}

describe("mergeProps", () => {
  it("merges event handlers", () => {
    const theirProps = {
      onClick: vi.fn(),
      onKeyDown: vi.fn(),
    };
    const ourProps = {
      onClick: vi.fn(),
      onPaste: vi.fn(),
    };
    const mergedProps = mergeProps(ourProps, theirProps);

    mergedProps.onClick?.(clickEvent());
    mergedProps.onKeyDown?.(new KeyboardEvent("keydown"));
    mergedProps.onPaste?.(new Event("paste"));

    expect(theirProps.onClick.mock.invocationCallOrder[0]).toBeLessThan(
      ourProps.onClick.mock.invocationCallOrder[0],
    );
    expect(theirProps.onClick.mock.calls.length).toBe(1);
    expect(ourProps.onClick.mock.calls.length).toBe(1);
    expect(theirProps.onKeyDown.mock.calls.length).toBe(1);
    expect(ourProps.onPaste.mock.calls.length).toBe(1);
  });

  it("merges multiple event handlers", () => {
    const log: string[] = [];

    const mergedProps = mergeProps(
      {
        onClick() {
          log.push("3");
        },
      },
      {
        onClick() {
          log.push("2");
        },
      },
      {
        onClick() {
          log.push("1");
        },
      },
    );

    mergedProps.onClick?.(clickEvent());
    expect(log).toEqual(["1", "2", "3"]);
  });

  it("merges undefined event handlers", () => {
    const log: string[] = [];

    const mergedProps = mergeProps(
      {
        onClick() {
          log.push("3");
        },
      },
      {
        onClick: undefined,
      },
      {
        onClick() {
          log.push("1");
        },
      },
    );

    mergedProps.onClick?.(clickEvent());
    expect(log).toEqual(["1", "3"]);
  });

  it("makes a lone event handler preventable", () => {
    let prevented: boolean | undefined = false;

    const mergedProps = mergeProps(
      {},
      {
        onMouseDown(event: MouseEvent & BaseUIHandledEvent) {
          event.preventBaseUIHandler();
          prevented = event.baseUIHandlerPrevented;
        },
      },
    );

    mergedProps.onMouseDown?.(new MouseEvent("mousedown"));

    expect(prevented).toBe(true);
  });

  it("makes a first-position event handler preventable", () => {
    let prevented: boolean | undefined = false;

    const mergedProps = mergeProps(
      {
        onMouseDown(event: MouseEvent & BaseUIHandledEvent) {
          event.preventBaseUIHandler();
          prevented = event.baseUIHandlerPrevented;
        },
      },
      {
        id: "test-button",
      },
    );

    mergedProps.onMouseDown?.(new MouseEvent("mousedown"));

    expect(prevented).toBe(true);
  });

  it("makes a first-position event handler preventable in mergePropsN", () => {
    let prevented: boolean | undefined = false;

    const mergedProps = mergePropsN([
      {
        onMouseDown(event: MouseEvent & BaseUIHandledEvent) {
          event.preventBaseUIHandler();
          prevented = event.baseUIHandlerPrevented;
        },
      },
      {
        id: "test-button",
      },
    ]);

    mergedProps.onMouseDown?.(new MouseEvent("mousedown"));

    expect(prevented).toBe(true);
  });

  it("makes a lone obscure event handler preventable", () => {
    let prevented: boolean | undefined = false;

    const mergedProps = mergeProps(
      {},
      {
        onContextMenu(event: MouseEvent & BaseUIHandledEvent) {
          event.preventBaseUIHandler();
          prevented = event.baseUIHandlerPrevented;
        },
      },
    );

    mergedProps.onContextMenu?.(new MouseEvent("contextmenu"));

    expect(prevented).toBe(true);
  });

  it("attaches the prevention protocol to real DOM events passed straight through", () => {
    // Unlike React, Solid hands components native events. A handler must be able to call
    // preventBaseUIHandler even when the event never flowed through mergeProps first.
    const event = new MouseEvent("mousedown") as MouseEvent & BaseUIHandledEvent;
    let prevented: boolean | undefined = false;

    const mergedProps = mergeProps(
      {},
      {
        onMouseDown(event: MouseEvent & BaseUIHandledEvent) {
          event.preventBaseUIHandler();
          prevented = event.baseUIHandlerPrevented;
        },
      },
    );

    mergedProps.onMouseDown?.(event);

    expect(prevented).toBe(true);
    expect(event.baseUIHandlerPrevented).toBe(true);
  });

  it("merges styles", () => {
    const theirProps = {
      style: { color: "red" },
    };
    const ourProps = {
      style: { color: "blue", backgroundColor: "blue" },
    };
    const mergedProps = mergeProps(ourProps, theirProps);

    expect(mergedProps.style).toEqual({
      color: "red",
      backgroundColor: "blue",
    });
  });

  it("merges styles with undefined", () => {
    const theirProps = {
      style: { color: "red" },
    };
    const ourProps = {};

    const mergedProps = mergeProps(ourProps, theirProps);

    expect(mergedProps.style).toEqual({
      color: "red",
    });
  });
  it("does not merge styles if both are undefined", () => {
    const theirProps = {};
    const ourProps = {};
    const mergedProps = mergeProps(ourProps, theirProps);

    expect(mergedProps.style).toBe(undefined);
  });

  it("merges string styles after serialized object styles so the string wins conflicts", () => {
    const theirProps = { style: "color: red" };
    const ourProps = { style: { color: "blue", backgroundColor: "blue" } };

    const mergedProps = mergeProps(ourProps, theirProps);

    expect(mergedProps.style).toBe("color:blue;background-color:blue;color: red");
  });

  it("merges classNames with rightmost first", () => {
    const theirProps = {
      className: "external-class",
    };
    const ourProps = {
      className: "internal-class",
    };
    const mergedProps = mergeProps(ourProps, theirProps);

    expect(mergedProps.className).toBe("external-class internal-class");
  });

  it("merges multiple classNames", () => {
    const mergedProps = mergeProps(
      {
        className: "class-1",
      },
      {
        className: "class-2",
      },
      {
        className: "class-3",
      },
    );

    expect(mergedProps.className).toBe("class-3 class-2 class-1");
  });

  it("merges classNames with undefined", () => {
    const theirProps = {
      className: "external-class",
    };
    const ourProps = {};

    const mergedProps = mergeProps(ourProps, theirProps);

    expect(mergedProps.className).toBe("external-class");
  });

  it("does not merge classNames if both are undefined", () => {
    const theirProps = {};
    const ourProps = {};
    const mergedProps = mergeProps(ourProps, theirProps);

    expect(mergedProps.className).toBe(undefined);
  });

  it("does not prevent internal handler if event.preventBaseUIHandler() is not called", () => {
    let ran = false;

    const mergedProps = mergeProps(
      {
        onClick() {},
      },
      {
        onClick() {
          ran = true;
        },
      },
    );

    mergedProps.onClick?.(clickEvent());

    expect(ran).toBe(true);
  });

  it("prevents internal handler if event.preventBaseUIHandler() is called", () => {
    let ran = false;

    const mergedProps = mergeProps(
      {
        onClick: function onClick3() {
          ran = true;
        },
      },
      {
        onClick: function onClick2() {
          ran = true;
        },
      },
      {
        onClick: function onClick1(event: MouseEvent & BaseUIHandledEvent) {
          event.preventBaseUIHandler();
        },
      },
    );

    const event = clickEvent();
    mergedProps.onClick?.(event);

    expect(ran).toBe(false);
  });

  it("prevents handlers merged after event.preventBaseUIHandler() is called", () => {
    const log: string[] = [];

    const mergedProps = mergeProps(
      {
        onClick() {
          log.push("2");
        },
      },
      {
        onClick(event: MouseEvent & BaseUIHandledEvent) {
          event.preventBaseUIHandler();
          log.push("1");
        },
      },
      {
        onClick() {
          log.push("0");
        },
      },
    );

    mergedProps.onClick?.(clickEvent());

    expect(log).toEqual(["0", "1"]);
  });

  [true, 13, "newValue", { key: "value" }, ["value"], () => "value"].forEach((eventArgument) => {
    it("handles non-standard event handlers without error", () => {
      const log: string[] = [];

      const mergedProps = mergeProps(
        {
          onValueChange() {
            log.push("1");
          },
        },
        {
          onValueChange() {
            log.push("0");
          },
        },
      );

      mergedProps.onValueChange(eventArgument);

      expect(log).toEqual(["0", "1"]);
    });
  });

  it("forwards all arguments for a lone non-standard event handler", () => {
    const handler = vi.fn();

    const mergedProps = mergeProps(
      {},
      {
        onOpenChange: handler,
      },
    );

    const eventDetails = { reason: "test" };
    mergedProps.onOpenChange?.(true, eventDetails);

    expect(handler).toHaveBeenCalledWith(true, eventDetails);
  });

  it("forwards all arguments for merged non-standard event handlers", () => {
    const log: Array<[string, boolean, { reason: string }]> = [];
    const eventDetails = { reason: "test" };

    const mergedProps = mergeProps(
      {
        onOpenChange(open: boolean, details: { reason: string }) {
          log.push(["ours", open, details]);
        },
      },
      {
        onOpenChange(open: boolean, details: { reason: string }) {
          log.push(["theirs", open, details]);
        },
      },
    );

    mergedProps.onOpenChange?.(true, eventDetails);

    expect(log).toEqual([
      ["theirs", true, eventDetails],
      ["ours", true, eventDetails],
    ]);
  });

  it("forwards additional arguments for DOM event handlers", () => {
    const log: Array<[string, string]> = [];

    const mergedProps = mergeProps(
      {
        onMouseDown(_event: MouseEvent, details: { reason: string }) {
          log.push(["ours", details.reason]);
        },
      },
      {
        onMouseDown(_event: MouseEvent, details: { reason: string }) {
          log.push(["theirs", details.reason]);
        },
      },
    );

    mergedProps.onMouseDown?.(new MouseEvent("mousedown"), { reason: "pointer" });

    expect(log).toEqual([
      ["theirs", "pointer"],
      ["ours", "pointer"],
    ]);
  });

  it("merges internal props so that the ones defined first override the ones defined later", () => {
    const mergedProps = mergeProps(
      {
        title: "internal title 2",
      },
      {
        title: "internal title 1",
      },
      {},
    );

    expect(mergedProps.title).toBe("internal title 1");
  });

  it("sets baseUIHandlerPrevented to true after calling preventBaseUIHandler()", () => {
    let observedFlag: boolean | undefined;

    const mergedProps = mergeProps(
      {
        onClick() {},
      },
      {
        onClick(event: MouseEvent & BaseUIHandledEvent) {
          event.preventBaseUIHandler();
          observedFlag = event.baseUIHandlerPrevented;
        },
      },
    );

    mergedProps.onClick?.(clickEvent());

    expect(observedFlag).toBe(true);
  });

  describe("props getters", () => {
    it("calls the props getter with the props merged before it", () => {
      let observedProps: Record<string, unknown> | undefined;
      const propsGetter = vi.fn((props: Record<string, unknown>) => {
        observedProps = { ...props };
        return props;
      });

      mergeProps(
        {
          id: "2",
          className: "test-class",
        },
        propsGetter,
        {
          id: "1",
          role: "button",
        },
      );

      expect(propsGetter.mock.calls.length === 1).toBe(true);
      expect(observedProps).toEqual({ id: "2", className: "test-class" });
    });

    it("calls the props getter with merged props defined after it", () => {
      let observedProps: Record<string, unknown> | undefined;
      const propsGetter = vi.fn((props: Record<string, unknown>) => {
        observedProps = { ...props };
        return props;
      });

      mergeProps(
        {
          role: "button",
          className: "test-class",
        },
        {
          role: "tab",
        },
        propsGetter,
        {
          id: "one",
        },
      );

      expect(propsGetter.mock.calls.length === 1).toBe(true);
      expect(observedProps).toEqual({
        role: "tab",
        className: "test-class",
      });
    });

    it("calls the props getter with an empty object if no props are defined after it", () => {
      let observedProps: Record<string, unknown> | undefined;
      const propsGetter = vi.fn((props: Record<string, unknown>) => {
        observedProps = { ...props };
        return props;
      });

      mergeProps(propsGetter, { id: "1" });

      expect(propsGetter.mock.calls.length === 1).toBe(true);
      expect(observedProps).toEqual({});
    });

    it("does not mutate a reused object returned by the first props getter", () => {
      const shared = { className: "base" };

      const result = mergeProps(() => shared, {
        className: "next",
      });

      expect(result).toEqual({
        className: "next base",
      });
      expect(shared).toEqual({
        className: "base",
      });
    });

    it("accepts the result of the props getter", () => {
      const propsGetter = () => ({ className: "test-class" });
      const result = mergeProps(
        {
          id: "two",
          role: "tab",
        },
        {
          id: "one",
        },
        propsGetter,
      );

      expect(result).toEqual({
        className: "test-class",
      });
    });

    it("does not automatically prevent handlers that are manually called by getter handlers", () => {
      const log: string[] = [];

      const mergedProps = mergeProps(
        {
          onClick() {
            log.push("first-handler");
          },
        },
        (props: Record<string, unknown>) => ({
          onClick(event: MouseEvent & BaseUIHandledEvent) {
            // Call preventBaseUIHandler to signal prevention
            event.preventBaseUIHandler();
            log.push("getter-handler");
            // Manually calling the previous handler - this bypasses automatic prevention!
            (props.onClick as (event: Event) => void)(clickEvent());
          },
        }),
        {
          onClick() {
            // This handler does NOT call preventBaseUIHandler, so getter-handler runs
            log.push("last-handler");
          },
        },
      );

      mergedProps.onClick?.(clickEvent());

      // last-handler runs first, then getter-handler (not prevented), then getter-handler
      // manually calls first-handler which runs despite preventBaseUIHandler being called
      expect(log).toEqual(["last-handler", "getter-handler", "first-handler"]);
    });

    it("allows props getter handlers to check baseUIHandlerPrevented manually", () => {
      const log: string[] = [];

      const mergedProps = mergeProps(
        {
          onClick() {
            log.push("first-handler");
          },
        },
        (props: Record<string, unknown>) => ({
          onClick(event: MouseEvent & BaseUIHandledEvent) {
            // Call preventBaseUIHandler to signal prevention
            event.preventBaseUIHandler();
            log.push("getter-handler");
            // Check the flag before manually calling previous handlers - this respects prevention
            if (!event.baseUIHandlerPrevented) {
              (props.onClick as (event: Event) => void)(clickEvent());
            }
          },
        }),
        {
          onClick() {
            // This handler does NOT call preventBaseUIHandler, so getter-handler runs
            log.push("last-handler");
          },
        },
      );

      mergedProps.onClick?.(clickEvent());

      // first-handler does NOT run because getter-handler checks the flag before calling it
      expect(log).toEqual(["last-handler", "getter-handler"]);
    });
  });
});

describe("mergeClassNames", () => {
  it("concatenates with the later class first", () => {
    expect(mergeClassNames("a", "b")).toBe("b a");
  });

  it("returns whichever side is defined", () => {
    expect(mergeClassNames(undefined, "b")).toBe("b");
    expect(mergeClassNames("a", undefined)).toBe("a");
    expect(mergeClassNames(undefined, undefined)).toBe(undefined);
  });
});
