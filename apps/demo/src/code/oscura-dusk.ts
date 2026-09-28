import type { HighlightTheme } from "@tanstack/highlight/theme";

/*
 * Oscura Dusk as a TanStack Highlight theme.
 *
 * Derived from the Oscura VSCode theme (narative/oscura, MIT), Dusk variant,
 * via its OpenVSX/VSCode distribution: every value below comes from its
 * `tokenColors` or workbench `colors`. Oscura is deliberately restrained, so
 * several token classes share one color, exactly like the editor does.
 *
 * editor.background #131419  -> background
 * editor.foreground #E6E6E6  -> foreground, token, variable, code-inline, command
 * Comment #46474F            -> comment
 * Keyword, Storage #9099A1  -> keyword, operator (control keywords included)
 * Tag / Function / Class #E6E7A3 (pale yellow) -> tag, function, heading,
 *   attr (HTML attribute names), property (JSON keys), type (support types)
 * Number, Constant #F9B98C (peach) -> number, literal
 * String Literals in TS/JS #4EBE96 (mint) -> string, inserted (diff added)
 * Attributes #54C0A3 (teal) -> selector (CSS selectors)
 * URL #479FFA               -> link
 * Invalid #D84F68            -> deleted (diff removed)
 * markup.quote description #868F97 -> meta
 *
 * The matching CSS lives in ./code-themes.css alongside the light theme. Its
 * dark variable block is the output of `createThemeCss` for this object, so
 * the markup never changes between site themes: one compact `th-*` tree,
 * recolored purely with CSS.
 */
export const oscuraDuskTheme: HighlightTheme = {
  background: "#131419",
  foreground: "#E6E6E6",
  name: "oscura-dusk",
  tokens: {
    attr: "#E6E7A3",
    "code-inline": "#E6E6E6",
    command: "#E6E6E6",
    comment: "#46474F",
    deleted: "#D84F68",
    function: "#E6E7A3",
    heading: "#E6E7A3",
    inserted: "#4EBE96",
    keyword: "#9099A1",
    link: "#479FFA",
    literal: "#F9B98C",
    meta: "#868F97",
    number: "#F9B98C",
    operator: "#9099A1",
    property: "#E6E7A3",
    selector: "#54C0A3",
    string: "#4EBE96",
    tag: "#E6E7A3",
    token: "#E6E6E6",
    type: "#E6E7A3",
    variable: "#E6E6E6",
  },
  type: "dark",
};
