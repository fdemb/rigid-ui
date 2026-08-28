import { createSignal, flush } from "solid-js";
import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vite-plus/test";
import { renderPart } from "./renderPart";
import { mergeProps, type MergeableProps } from "./mergeProps";
import type { StateAttributesMapping } from "./getStateAttributesProps";

interface ProbeState extends Record<string, unknown> {
  open: boolean;
}

function Probe(props: Record<string, unknown>) {
  const [open, setOpen] = createSignal(false);
  return renderPart<HTMLButtonElement, ProbeState>("button", props, {
    state: () => ({ open: open() }),
    props: {
      get "aria-expanded"() {
        return open() ? "true" : "false";
      },
      onClick: () => setOpen((value) => !value),
    },
  });
}

describe("renderPart", () => {
  describe("default element", () => {
    it("renders the default tag with its tag defaults", () => {
      const { container } = render(() => <Probe class="c">label</Probe>);
      const button = container.firstElementChild as HTMLButtonElement;

      expect(button.tagName).toBe("BUTTON");
      expect(button.getAttribute("type")).toBe("button");
      expect(button.className).toBe("c");
      expect(button.textContent).toBe("label");
    });

    it("keeps internal props and state attributes reactive", () => {
      const { container } = render(() => <Probe />);
      const button = container.firstElementChild as HTMLElement;

      expect(button.getAttribute("aria-expanded")).toBe("false");
      expect(button.hasAttribute("data-open")).toBe(false);

      fireEvent.click(button);
      flush();

      expect(button.getAttribute("aria-expanded")).toBe("true");
      expect(button.getAttribute("data-open")).toBe("");
    });

    it("lets the consumer override tag defaults", () => {
      const { container } = render(() => <Probe type="submit" />);
      expect((container.firstElementChild as HTMLButtonElement).type).toBe("submit");
    });
  });

  describe("render as a tag name", () => {
    it("replaces the element and drops the default tag's props", () => {
      const { container } = render(() => (
        <Probe render="a" href="#x">
          label
        </Probe>
      ));
      const anchor = container.firstElementChild as HTMLAnchorElement;

      expect(anchor.tagName).toBe("A");
      expect(anchor.hasAttribute("type")).toBe(false);
      expect(anchor.getAttribute("href")).toBe("#x");
      expect(anchor.textContent).toBe("label");
    });

    it("applies the replacement tag's own defaults", () => {
      const { container } = render(() => <Probe render="img" src="/a.png" />);
      expect(container.firstElementChild?.getAttribute("alt")).toBe("");
    });

    it("keeps internal props and state attributes on the replacement", () => {
      const { container } = render(() => <Probe render="a" />);
      const anchor = container.firstElementChild as HTMLElement;

      expect(anchor.getAttribute("aria-expanded")).toBe("false");

      fireEvent.click(anchor);
      flush();

      expect(anchor.getAttribute("aria-expanded")).toBe("true");
      expect(anchor.getAttribute("data-open")).toBe("");
    });

    it("creates SVG children in the SVG namespace", () => {
      const { container } = render(() => {
        const Icon = (props: Record<string, unknown>) =>
          renderPart<SVGSVGElement & HTMLElement>("svg", props);
        return <Icon render="circle" />;
      });

      expect(container.firstElementChild?.namespaceURI).toBe("http://www.w3.org/2000/svg");
    });
  });

  describe("render as a callback", () => {
    it("receives the prop bag and renders the returned element", () => {
      const { container } = render(() => (
        <Probe render={(props: MergeableProps) => <a {...props}>label</a>} data-testid="probe" />
      ));
      const anchor = container.firstElementChild as HTMLElement;

      expect(anchor.tagName).toBe("A");
      expect(anchor.getAttribute("data-testid")).toBe("probe");
      expect(anchor.hasAttribute("type")).toBe(false);
      expect(anchor.textContent).toBe("label");
    });

    it("receives state as a live object rather than a snapshot", () => {
      const { container } = render(() => (
        <Probe
          render={(props: MergeableProps, state: ProbeState) => (
            <a {...props}>{state.open ? "open" : "closed"}</a>
          )}
        />
      ));
      const anchor = container.firstElementChild as HTMLElement;

      expect(anchor.textContent).toBe("closed");

      fireEvent.click(anchor);
      flush();

      expect(anchor.textContent).toBe("open");
    });

    it("merges the callback's own props through mergeProps", () => {
      const log: string[] = [];
      const { container } = render(() => (
        <Probe
          class="outer"
          render={(props: MergeableProps) => (
            <a {...mergeProps(props, { class: "inner", onClick: () => log.push("callback") })} />
          )}
          onClick={() => log.push("consumer")}
        />
      ));
      const anchor = container.firstElementChild as HTMLElement;

      expect(anchor.className).toBe("inner outer");

      fireEvent.click(anchor);
      flush();

      expect(log).toEqual(["callback", "consumer"]);
      expect(anchor.getAttribute("aria-expanded")).toBe("true");
    });

    it("accepts a component as the callback", () => {
      function CustomLink(props: Record<string, unknown>) {
        return <a {...props} data-custom="" />;
      }
      const { container } = render(() => <Probe render={CustomLink} href="#y" />);
      const anchor = container.firstElementChild as HTMLElement;

      expect(anchor.tagName).toBe("A");
      expect(anchor.getAttribute("data-custom")).toBe("");
      expect(anchor.getAttribute("href")).toBe("#y");
      expect(anchor.getAttribute("aria-expanded")).toBe("false");
    });

    it("is read once, so a component render prop is invoked a single time", () => {
      let calls = 0;
      function Counted(props: Record<string, unknown>) {
        calls += 1;
        return <a {...props} />;
      }
      render(() => <Probe render={Counted} />);
      expect(calls).toBe(1);
    });
  });

  describe("composition", () => {
    it("stacks parts onto one element with outermost-first handlers", () => {
      const log: string[] = [];

      function Outer(props: Record<string, unknown>) {
        return renderPart<HTMLButtonElement>("button", props, {
          props: { "data-outer": "", onClick: () => log.push("outer") },
          ref: () => log.push("outer-ref"),
        });
      }
      function Inner(props: Record<string, unknown>) {
        return renderPart<HTMLButtonElement>("button", props, {
          props: { "data-inner": "", onClick: () => log.push("inner") },
          ref: () => log.push("inner-ref"),
        });
      }

      const { container } = render(() => (
        <Outer
          render={(props: Record<string, unknown>) => (
            <Inner {...mergeProps(props, { onClick: () => log.push("consumer") })} />
          )}
        >
          label
        </Outer>
      ));

      const button = container.firstElementChild as HTMLElement;
      expect(button.getAttribute("data-outer")).toBe("");
      expect(button.getAttribute("data-inner")).toBe("");
      expect(button.textContent).toBe("label");
      expect(log).toEqual(["inner-ref", "outer-ref"]);

      log.length = 0;
      fireEvent.click(button);
      expect(log).toEqual(["consumer", "outer", "inner"]);
    });
  });

  describe("state attributes", () => {
    it("applies a custom mapping on a replaced element", () => {
      const [status, setStatus] = createSignal<string | undefined>("starting");
      const mapping: StateAttributesMapping<{ transitionStatus: string | undefined }> = {
        transitionStatus(value): Record<string, string> | null {
          if (value === "starting") return { "data-starting-style": "" };
          if (value === "ending") return { "data-ending-style": "" };
          return null;
        },
      };

      const { container } = render(() => {
        const Part = (props: Record<string, unknown>) =>
          renderPart<HTMLDivElement, { transitionStatus: string | undefined }>("div", props, {
            state: () => ({ transitionStatus: status() }),
            stateAttributesMapping: mapping,
          });
        return <Part render="section" />;
      });

      const element = container.firstElementChild as HTMLElement;
      expect(element.tagName).toBe("SECTION");
      expect(element.hasAttribute("data-starting-style")).toBe(true);

      setStatus("ending");
      flush();

      expect(element.hasAttribute("data-starting-style")).toBe(false);
      expect(element.hasAttribute("data-ending-style")).toBe(true);
    });
  });

  describe("class and style", () => {
    it("resolves function-form class and style against state on a replaced element", () => {
      const { container } = render(() => (
        <Probe
          render="a"
          class={(state: ProbeState) => (state.open ? "is-open" : "is-closed")}
          style={(state: ProbeState) => ({ color: state.open ? "red" : "blue" })}
        />
      ));
      const anchor = container.firstElementChild as HTMLElement;

      expect(anchor.className).toBe("is-closed");
      expect(anchor.style.color).toBe("blue");

      fireEvent.click(anchor);
      flush();

      expect(anchor.className).toBe("is-open");
      expect(anchor.style.color).toBe("red");
    });
  });

  describe("refs", () => {
    it("composes internal refs, an array ref, and a function ref", () => {
      const seen: string[] = [];
      const { container } = render(() => {
        const Part = (props: Record<string, unknown>) =>
          renderPart<HTMLDivElement>("div", props, {
            ref: () => seen.push("internal"),
          });
        return (
          <Part
            ref={[
              (element: HTMLElement) => seen.push(`a:${element.tagName}`),
              (element: HTMLElement) => seen.push(`b:${element.tagName}`),
            ]}
          />
        );
      });

      expect(container.firstElementChild).not.toBeNull();
      expect(seen).toEqual(["internal", "a:DIV", "b:DIV"]);
    });
  });

  describe("children", () => {
    it("passes children through the bag so the callback can place them", () => {
      const { container } = render(() => (
        <Probe render={(props: MergeableProps) => <a {...props} />}>
          <span>child</span>
        </Probe>
      ));

      expect(container.querySelector("a > span")?.textContent).toBe("child");
    });

    it("lets the callback ignore the bag's children", () => {
      const { container } = render(() => (
        <Probe render={(props: MergeableProps) => <a {...props}>replaced</a>}>original</Probe>
      ));

      expect(container.firstElementChild?.textContent).toBe("replaced");
    });
  });
});
