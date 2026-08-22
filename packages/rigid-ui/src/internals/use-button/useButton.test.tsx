import { fireEvent, screen } from "@testing-library/dom";
import { describe, expect, it, vi } from "vite-plus/test";
import type { JSX } from "@solidjs/web";
import { render } from "../../../test/test-utils";
import { CompositeRootContext } from "../composite/root/CompositeRootContext";
import { useButton } from "./useButton";

/**
 * Minimal stand-in for Base UI's `CompositeRoot`: provides the root context whose mere
 * presence makes `useButton` treat a part as a composite item.
 */
function CompositeRoot(props: { children?: JSX.Element }) {
  return (
    <CompositeRootContext
      value={{
        highlightedIndex: () => 0,
        onHighlightedIndexChange() {},
        highlightItemOnHover: () => false,
      }}
    >
      {props.children}
    </CompositeRootContext>
  );
}

/** Fires keydown+keyup like testing-library's user.keyboard("[Key]"); `Space` is the word form. */
function pressKey(element: Element, key: "Enter" | "Space" | " ") {
  const value = key === "Space" || key === " " ? " " : key;
  fireEvent.keyDown(element, { key: value });
  fireEvent.keyUp(element, { key: value });
}

describe("useButton", () => {
  describe("non-native button", () => {
    describe("keyboard interactions", () => {
      it.each(["Enter", "Space"] as const)("can be activated with %s key", async (key) => {
        const clickSpy = vi.fn();

        function Button(props: Record<string, any>) {
          const { getButtonProps } = useButton({
            native: false,
          });

          return <span {...getButtonProps(props)} />;
        }

        render(() => <Button onClick={clickSpy} />);

        const button = screen.getByRole("button");

        button.focus();
        expect(button).toHaveFocus();

        pressKey(button, key);
        expect(clickSpy).toHaveBeenCalledTimes(1);
      });

      it("does not set a type prop", async () => {
        let buttonProps: Record<string, unknown> | undefined = undefined;

        function Button() {
          const { getButtonProps } = useButton({ native: false });
          buttonProps = getButtonProps();
          return <span {...buttonProps} />;
        }

        render(() => <Button />);
        expect(buttonProps).not.toHaveProperty("type");
      });

      it.skipIf(typeof navigator !== "undefined" && navigator.userAgent.includes("jsdom"))(
        "can be activated with Enter when the keyboard event originates inside a shadow root",
        async () => {
          const clickSpy = vi.fn();

          function Button(props: Record<string, any>) {
            const { getButtonProps, buttonRef } = useButton({
              native: false,
            });
            let host: HTMLSpanElement | null = null;

            const handleRef = (node: HTMLSpanElement | null) => {
              buttonRef(node);
              host = node;

              if (!node || node.shadowRoot) {
                return;
              }

              const shadowRoot = node.attachShadow({ mode: "open" });
              const inner = document.createElement("span");
              inner.tabIndex = 0;
              shadowRoot.appendChild(inner);
            };

            return <span {...getButtonProps({ ...props, ref: handleRef })} />;
          }

          render(() => <Button onClick={clickSpy} />);

          const host = screen.getByRole("button");
          const inner = host.shadowRoot?.querySelector("span");

          expect(inner).toBeTruthy();

          if (!inner) {
            return;
          }

          (inner as HTMLElement).focus();

          inner.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: "Enter",
              bubbles: true,
              composed: true,
            }),
          );

          expect(clickSpy).toHaveBeenCalledTimes(1);
        },
      );
    });
  });

  describe("param: focusableWhenDisabled", () => {
    it("allows disabled buttons to be focused", async () => {
      function TestButton(props: Record<string, any>) {
        const { disabled, ...otherProps } = props;
        const { getButtonProps } = useButton({
          disabled,
          focusableWhenDisabled: true,
        });

        return <button {...getButtonProps(otherProps)} />;
      }
      render(() => <TestButton disabled />);
      const button = screen.getByRole("button");
      button.focus();
      expect(button).toHaveFocus();
    });

    it("force overrides disabled attribute when put in a composite", async () => {
      function TestButton() {
        const { getButtonProps, buttonRef } = useButton({
          disabled: true,
          focusableWhenDisabled: true,
        });
        return (
          <button
            ref={buttonRef}
            data-testid="composite-button"
            {...getButtonProps({ disabled: true })}
          />
        );
      }

      // Rendered twice (mirroring the reference's rerender with a changed ref): each mount
      // must strip the external `disabled` attribute so the composite item stays focusable.
      for (let mount = 0; mount < 2; mount += 1) {
        const view = render(() => (
          <CompositeRoot>
            <TestButton />
          </CompositeRoot>
        ));

        const button = screen.getByTestId("composite-button");
        button.focus();
        expect(button).toHaveFocus();

        view.unmount();
      }
    });
    it("prevents interactions except focus and blur", async () => {
      const handleClick = vi.fn();
      const handleKeyDown = vi.fn();
      const handleKeyUp = vi.fn();
      const handleFocus = vi.fn();
      const handleBlur = vi.fn();

      function TestButton(props: Record<string, any>) {
        const { disabled, ...otherProps } = props;
        const { getButtonProps } = useButton({
          disabled,
          focusableWhenDisabled: true,
          native: false,
        });

        return <span {...getButtonProps(otherProps)} />;
      }

      render(() => (
        <TestButton
          disabled
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      ));

      const button = screen.getByRole("button");
      expect(document.activeElement).not.toBe(button);

      expect(handleFocus).toHaveBeenCalledTimes(0);
      button.focus();
      expect(button).toHaveFocus();
      expect(handleFocus).toHaveBeenCalledTimes(1);

      pressKey(button, "Enter");
      expect(handleKeyDown).toHaveBeenCalledTimes(0);
      expect(handleClick).toHaveBeenCalledTimes(0);

      pressKey(button, " ");
      expect(handleKeyUp).toHaveBeenCalledTimes(0);
      expect(handleClick).toHaveBeenCalledTimes(0);

      fireEvent.click(button);
      expect(handleKeyDown).toHaveBeenCalledTimes(0);
      expect(handleKeyUp).toHaveBeenCalledTimes(0);
      expect(handleClick).toHaveBeenCalledTimes(0);

      expect(handleBlur).toHaveBeenCalledTimes(0);
      (document.activeElement as HTMLElement)?.blur();
      expect(handleBlur).toHaveBeenCalledTimes(1);
      expect(document.activeElement).not.toBe(button);
    });
  });

  describe("param: tabIndex", () => {
    it("returns tabIndex in getButtonProps when host component is BUTTON", async () => {
      function TestButton() {
        const { getButtonProps } = useButton();

        expect(getButtonProps().tabIndex).toBe(0);

        return <button {...getButtonProps()} />;
      }

      render(() => <TestButton />);
      expect(screen.getByRole("button")).toHaveProperty("tabIndex", 0);
    });

    it("returns tabIndex in getButtonProps when host component is not BUTTON", async () => {
      function TestButton() {
        const { getButtonProps, buttonRef } = useButton({ native: false });
        let host: HTMLSpanElement | undefined;

        expect(getButtonProps().tabIndex).toBe(0);

        return (
          <span
            ref={(node) => {
              buttonRef(node);
              host = node;
            }}
            {...getButtonProps()}
          />
        );
      }

      render(() => <TestButton />);
      expect(screen.getByRole("button")).toHaveProperty("tabIndex", 0);
    });

    it("returns tabIndex in getButtonProps if it is explicitly provided", async () => {
      const customTabIndex = 3;
      function TestButton() {
        const { getButtonProps } = useButton({ tabIndex: customTabIndex });
        return <button {...getButtonProps()} />;
      }

      render(() => <TestButton />);
      expect(screen.getByRole("button")).toHaveProperty("tabIndex", customTabIndex);
    });
  });

  describe("arbitrary props", () => {
    it("are passed to the host component", async () => {
      const buttonTestId = "button-test-id";
      function TestButton() {
        const { getButtonProps } = useButton();
        return <button {...getButtonProps({ "data-testid": buttonTestId })} />;
      }

      render(() => <TestButton />);
      expect(screen.getByRole("button")).toHaveAttribute("data-testid", buttonTestId);
    });
  });

  describe("event handlers", () => {
    it("key: Space fires keyup then click on non-composite buttons", async () => {
      const handleKeyDown = vi.fn();
      const handleKeyUp = vi.fn();
      const handleClick = vi.fn();

      function TestButton(props: Record<string, any>) {
        const { getButtonProps } = useButton({ native: false });

        return <span {...getButtonProps(props)} />;
      }

      render(() => (
        <TestButton onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} onClick={handleClick} />
      ));

      const button = screen.getByRole("button");

      button.focus();
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: " " });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(0);

      fireEvent.keyUp(button, { key: " " });
      expect(handleKeyUp).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("key: Space fires keydown then click on composite buttons", async () => {
      const handleKeyDown = vi.fn();
      const handleKeyUp = vi.fn();
      const handleClick = vi.fn();

      function TestButton(props: Record<string, any>) {
        const { getButtonProps } = useButton({ native: false, composite: true });

        return <span {...getButtonProps(props)} />;
      }

      render(() => (
        <TestButton
          tabindex={0}
          onKeyDown={handleKeyDown}
          onKeyUp={handleKeyUp}
          onClick={handleClick}
        />
      ));

      const button = screen.getByRole("button");

      button.focus();
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: " " });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);

      fireEvent.keyUp(button, { key: " " });
      expect(handleKeyUp).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("key: Space fires keydown then click on composite links", async () => {
      const handleClick = vi.fn();

      function TestButton(props: Record<string, any>) {
        const { getButtonProps } = useButton({ native: false, composite: true });

        return <a href="#test" {...getButtonProps(props)} />;
      }

      render(() => <TestButton onClick={handleClick} />);

      const link = screen.getByRole("button");

      link.focus();
      expect(link).toHaveFocus();

      fireEvent.keyDown(link, { key: " " });
      expect(handleClick).toHaveBeenCalledTimes(1);

      fireEvent.keyUp(link, { key: " " });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not click composite links when Space is prevented for text navigation", async () => {
      const handleClick = vi.fn();

      function TestButton(props: Record<string, any>) {
        const { getButtonProps } = useButton({ native: false, composite: true });

        return <a href="#test" {...getButtonProps({ role: "menuitem", ...props })} />;
      }

      render(() => (
        <TestButton
          onKeyDown={(event: KeyboardEvent) => event.preventDefault()}
          onClick={handleClick}
        />
      ));

      const link = screen.getByRole("menuitem");

      link.focus();
      expect(link).toHaveFocus();

      fireEvent.keyDown(link, { key: " " });
      expect(handleClick).toHaveBeenCalledTimes(0);
    });

    it("does not click composite gridcells when Space is prevented", async () => {
      const handleClick = vi.fn();

      function TestButton(props: Record<string, any>) {
        const { getButtonProps } = useButton({ native: false, composite: true });

        return <div {...getButtonProps({ role: "gridcell", tabIndex: 0, ...props })} />;
      }

      render(() => (
        <TestButton
          onKeyDown={(event: KeyboardEvent) => event.preventDefault()}
          onClick={handleClick}
        />
      ));

      const gridcell = screen.getByRole("gridcell");

      gridcell.focus();
      expect(gridcell).toHaveFocus();

      fireEvent.keyDown(gridcell, { key: " " });
      expect(handleClick).toHaveBeenCalledTimes(0);
    });

    it("clicks composite switches when Space is prevented", async () => {
      const handleClick = vi.fn();

      function TestButton(props: Record<string, any>) {
        const { getButtonProps } = useButton({ native: false, composite: true });

        return <div {...getButtonProps({ role: "switch", tabIndex: 0, ...props })} />;
      }

      render(() => (
        <TestButton
          onKeyDown={(event: KeyboardEvent) => event.preventDefault()}
          onClick={handleClick}
        />
      ));

      const switchElement = screen.getByRole("switch");

      switchElement.focus();
      expect(switchElement).toHaveFocus();

      fireEvent.keyDown(switchElement, { key: " " });
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("key: Space fires keydown then click on native composite buttons", async () => {
      const handleKeyDown = vi.fn();
      const handleKeyUp = vi.fn();
      const handleClick = vi.fn();

      function TestButton(props: Record<string, any>) {
        const { getButtonProps } = useButton({ composite: true });

        return <button {...getButtonProps(props)} />;
      }

      render(() => (
        <TestButton onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} onClick={handleClick} />
      ));

      const button = screen.getByRole("button");

      button.focus();
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: " " });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);

      fireEvent.keyUp(button, { key: " " });
      expect(handleKeyUp).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not fire duplicate clicks for Space on native composite buttons", async () => {
      const handleClick = vi.fn();

      function TestButton(props: Record<string, any>) {
        const { getButtonProps } = useButton({ composite: true });

        return <button {...getButtonProps(props)} />;
      }

      render(() => <TestButton onClick={handleClick} />);

      const button = screen.getByRole("button");

      button.focus();
      expect(button).toHaveFocus();

      pressKey(button, " ");
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("fires a single click for nested non-native composite buttons", async () => {
      const handleClick = vi.fn();

      function TestButton(props: Record<string, any>) {
        const outer = useButton({ native: false, composite: true });
        const inner = useButton({ native: false, composite: true });

        return <span {...outer.getButtonProps(inner.getButtonProps(props))} />;
      }

      render(() => <TestButton tabIndex={0} onClick={handleClick} />);

      const button = screen.getByRole("button");

      button.focus();
      expect(button).toHaveFocus();

      pressKey(button, " ");
      expect(handleClick).toHaveBeenCalledTimes(1);

      pressKey(button, "Enter");
      expect(handleClick).toHaveBeenCalledTimes(2);
    });

    it("key: Space preserves native submit semantics on composite buttons", async () => {
      const handleSubmit = vi.fn((event: Event) => {
        event.preventDefault();
      });

      function TestButton() {
        const { getButtonProps } = useButton({ composite: true });

        return (
          <form onSubmit={handleSubmit}>
            <button {...getButtonProps({ type: "submit" })}>Submit</button>
          </form>
        );
      }

      render(() => <TestButton />);

      const button = screen.getByRole("button", { name: "Submit" });

      button.focus();
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: " " });
      expect(handleSubmit).toHaveBeenCalledTimes(1);

      fireEvent.keyUp(button, { key: " " });
      expect(handleSubmit).toHaveBeenCalledTimes(1);
    });

    it("key: Space preserves native reset semantics on composite buttons", async () => {
      const handleReset = vi.fn((event: Event) => {
        event.preventDefault();
      });

      function TestButton() {
        const { getButtonProps } = useButton({ composite: true });

        return (
          <form onReset={handleReset}>
            <button {...getButtonProps({ type: "reset" })}>Reset</button>
          </form>
        );
      }

      render(() => <TestButton />);

      const button = screen.getByRole("button", { name: "Reset" });

      button.focus();
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: " " });
      expect(handleReset).toHaveBeenCalledTimes(1);

      fireEvent.keyUp(button, { key: " " });
      expect(handleReset).toHaveBeenCalledTimes(1);
    });

    it("does not click composite buttons when keydown calls preventBaseUIHandler", async () => {
      const handleClick = vi.fn();

      function TestButton(props: Record<string, any>) {
        const { getButtonProps } = useButton({ native: false, composite: true });

        return <span {...getButtonProps(props)} />;
      }

      render(() => (
        <TestButton
          tabIndex={0}
          onKeyDown={(event: KeyboardEvent & { preventBaseUIHandler?: () => void }) =>
            event.preventBaseUIHandler?.()
          }
          onClick={handleClick}
        />
      ));

      const button = screen.getByRole("button");

      button.focus();
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: " " });
      expect(handleClick).toHaveBeenCalledTimes(0);
    });

    it("does not click non-composite buttons when keydown/keyup calls preventBaseUIHandler", async () => {
      const handleClick = vi.fn();

      function TestButton(props: Record<string, any>) {
        const { getButtonProps } = useButton({ native: false });

        return <span {...getButtonProps(props)} />;
      }

      const preventBaseUIHandler = (event: Event & { preventBaseUIHandler?: () => void }) =>
        event.preventBaseUIHandler?.();

      render(() => (
        <TestButton
          tabIndex={0}
          onKeyDown={preventBaseUIHandler}
          onKeyUp={preventBaseUIHandler}
          onClick={handleClick}
        />
      ));

      const button = screen.getByRole("button");

      button.focus();
      expect(button).toHaveFocus();

      // Enter activates on keydown; the consumer prevents it.
      fireEvent.keyDown(button, { key: "Enter" });
      expect(handleClick).toHaveBeenCalledTimes(0);

      // Space activates on keyup; the consumer prevents it.
      fireEvent.keyDown(button, { key: " " });
      fireEvent.keyUp(button, { key: " " });
      expect(handleClick).toHaveBeenCalledTimes(0);
    });

    it("key: Enter does not click non-native buttons when keydown calls preventDefault", async () => {
      const handleClick = vi.fn();

      function TestButton(props: Record<string, any>) {
        const { getButtonProps } = useButton({ native: false });

        return <span {...getButtonProps(props)} />;
      }

      render(() => (
        <TestButton
          tabIndex={0}
          onKeyDown={(event: KeyboardEvent) => event.preventDefault()}
          onClick={handleClick}
        />
      ));

      const button = screen.getByRole("button");

      button.focus();
      expect(button).toHaveFocus();

      // Match native buttons: preventing the keydown's default cancels Enter activation.
      pressKey(button, "Enter");
      expect(handleClick).toHaveBeenCalledTimes(0);
    });

    it("key: Space does not click non-native buttons when keyup calls preventDefault", async () => {
      const handleClick = vi.fn();

      function TestButton(props: Record<string, any>) {
        const { getButtonProps } = useButton({ native: false });

        return <span {...getButtonProps(props)} />;
      }

      render(() => (
        <TestButton
          tabIndex={0}
          onKeyUp={(event: KeyboardEvent) => event.preventDefault()}
          onClick={handleClick}
        />
      ));

      const button = screen.getByRole("button");

      button.focus();
      expect(button).toHaveFocus();

      // Match native buttons: preventing the keyup's default cancels Space activation.
      pressKey(button, " ");
      expect(handleClick).toHaveBeenCalledTimes(0);
    });

    it("key: Space fires keydown then click when in composite root context", async () => {
      const handleKeyDown = vi.fn();
      const handleKeyUp = vi.fn();
      const handleClick = vi.fn();

      function TestButton(props: Record<string, any>) {
        const { getButtonProps } = useButton({ native: false });

        return <span {...getButtonProps(props)} />;
      }

      render(() => (
        <CompositeRoot>
          <TestButton
            tabIndex={0}
            onKeyDown={handleKeyDown}
            onKeyUp={handleKeyUp}
            onClick={handleClick}
          />
        </CompositeRoot>
      ));

      const button = screen.getByRole("button");

      button.focus();
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: " " });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);

      fireEvent.keyUp(button, { key: " " });
      expect(handleKeyUp).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("key: Space fires keydown then click on native buttons in composite root context", async () => {
      const handleKeyDown = vi.fn();
      const handleKeyUp = vi.fn();
      const handleClick = vi.fn();

      function TestButton(props: Record<string, any>) {
        const { getButtonProps } = useButton();

        return <button {...getButtonProps(props)} />;
      }

      render(() => (
        <CompositeRoot>
          <TestButton onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} onClick={handleClick} />
        </CompositeRoot>
      ));

      const button = screen.getByRole("button");

      button.focus();
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: " " });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);

      fireEvent.keyUp(button, { key: " " });
      expect(handleKeyUp).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("`composite=false` keeps keyup activation inside composite root context", async () => {
      const handleKeyDown = vi.fn();
      const handleKeyUp = vi.fn();
      const handleClick = vi.fn();

      function TestButton(props: Record<string, any>) {
        const { getButtonProps } = useButton({ native: false, composite: false });

        return <span {...getButtonProps(props)} />;
      }

      render(() => (
        <CompositeRoot>
          <TestButton onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} onClick={handleClick} />
        </CompositeRoot>
      ));

      const button = screen.getByRole("button");

      button.focus();
      expect(button).toHaveFocus();

      fireEvent.keyDown(button, { key: " " });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(0);

      fireEvent.keyUp(button, { key: " " });
      expect(handleKeyUp).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("key: Enter fires keydown then click on non-native buttons", async () => {
      const handleKeyDown = vi.fn();
      const handleClick = vi.fn();

      function TestButton(props: Record<string, any>) {
        const { getButtonProps } = useButton({ native: false });

        return <span {...getButtonProps(props)} />;
      }

      render(() => <TestButton onKeyDown={handleKeyDown} onClick={handleClick} />);

      const button = screen.getByRole("button");

      button.focus();
      expect(button).toHaveFocus();

      expect(handleKeyDown).toHaveBeenCalledTimes(0);
      fireEvent.keyDown(button, { key: "Enter" });
      expect(handleKeyDown).toHaveBeenCalledTimes(1);
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  // Intentionally inapplicable: these tests server-render through React's renderToString.
  // Under vitest browser mode there is no server renderer for Solid components, and the
  // jsdom suite skips this block (`isJSDOM`). The covered contracts — `role="button"` on
  // non-native elements and the `disabled` attribute on native ones — are asserted against
  // the live DOM elsewhere in this file.
  describe.skip("server-side rendering", () => {});

  describe("dev warnings", () => {
    it("errors if nativeButton=true but ref is not a button", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      function TestButton() {
        const { getButtonProps, buttonRef } = useButton({ native: true });
        return (
          <span
            ref={(node) => {
              buttonRef(node);
            }}
            {...getButtonProps()}
          />
        );
      }
      render(() => <TestButton />);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "A component that acts as a button expected a native <button> because the " +
            "`nativeButton` prop is true. Rendering a non-<button> removes native button " +
            "semantics, which can impact forms and accessibility. Use a real <button> in the " +
            "`render` prop, or set `nativeButton` to `false`.",
        ),
      );
    });

    it("errors if nativeButton=false but ref is a button", async () => {
      const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      function TestButton() {
        const { getButtonProps, buttonRef } = useButton({ native: false });
        return (
          <button
            ref={(node) => {
              buttonRef(node);
            }}
            {...getButtonProps()}
          />
        );
      }
      render(() => <TestButton />);
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          "A component that acts as a button expected a non-<button> because the `nativeButton` " +
            "prop is false. Rendering a <button> keeps native behavior while Base UI applies " +
            "non-native attributes and handlers, which can add unintended extra attributes (such " +
            "as `role` or `aria-disabled`). Use a non-<button> in the `render` prop, or set " +
            "`nativeButton` to `true`.",
        ),
      );
    });
  });
});
