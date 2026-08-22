import { describe, expect, it } from "vite-plus/test";
import { getStateAttributesProps } from "./getStateAttributesProps";

/** Port of `reference/base-ui/packages/react/src/internals/getStateAttributesProps.test.ts`. */
describe("getStateAttributesProps", () => {
  it("converts the state fields to data attributes", () => {
    const result = getStateAttributesProps({ disabled: true, highlighted: "true" });
    expect(result).toEqual({
      "data-disabled": "",
      "data-highlighted": "true",
    });
  });

  it("changes the fields names to lowercase", () => {
    const result = getStateAttributesProps({ multiple: true, customTheme: "dark" });
    expect(result).toEqual({
      "data-multiple": "",
      "data-customtheme": "dark",
    });
  });

  it("changes true values to a data-attribute without a value", () => {
    const element = document.createElement("div");
    const attrs = getStateAttributesProps({ open: true });
    for (const [name, value] of Object.entries(attrs)) {
      if (value === "") {
        element.setAttribute(name, "");
      }
    }
    expect(element.hasAttribute("data-open")).toBe(true);
    expect(element.getAttribute("data-open")).toBe("");
  });

  it("does not include false values", () => {
    const result = getStateAttributesProps({ open: false, disabled: false });
    expect(result).toEqual({});
  });

  it("supports custom mapping", () => {
    const result = getStateAttributesProps(
      { transitionStatus: "starting" },
      {
        transitionStatus(value) {
          if (value === "starting") {
            return { "data-starting-style": "" };
          }
          return null;
        },
      },
    );
    expect(result).toEqual({ "data-starting-style": "" });
  });

  it("supports nulls returned from custom mapping", () => {
    const result = getStateAttributesProps(
      { transitionStatus: undefined },
      {
        transitionStatus() {
          return null;
        },
      },
    );
    expect(result).toEqual({});
  });
});
