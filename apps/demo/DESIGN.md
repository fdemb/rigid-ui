---
name: Rigid UI documentation
description: A restrained documentation system for Solid primitives and vendorable component recipes.
colors:
  canvas: "#fafafa"
  canvas-muted: "#f3f3f1"
  surface: "#ffffff"
  surface-sunken: "#f5f5f3"
  surface-interactive: "#f0f0ed"
  text: "#171717"
  text-muted: "#5f5f5b"
  text-subtle: "#74746f"
  border: "#e2e2de"
  border-strong: "#b8b8b1"
  accent: "#171717"
  accent-hover: "#343431"
  accent-text: "#ffffff"
  danger: "#c83f52"
  success: "#1f7a4d"
  warning: "#9a6410"
  focus: "#0f766e"
  code-background: "#171717"
  code-text: "#f5f5f1"
  code-text-muted: "#b6b6b1"
  dark-canvas: "#111110"
  dark-surface: "#191918"
  dark-text: "#f5f5f0"
  dark-border: "#30302d"
typography:
  display:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(2.5rem, 6vw, 4.75rem)"
    fontWeight: 690
    lineHeight: 0.94
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(1.75rem, 4vw, 2.75rem)"
    fontWeight: 680
    lineHeight: 1.02
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.1rem"
    fontWeight: 650
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  catalog-title:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.15rem)"
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: "-0.035em"
  lede:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.7
  entry:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 620
    lineHeight: 1.45
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.45
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, Liberation Mono, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.65
  micro:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.45
rounded:
  sm: "0.3125rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
  full: "999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "2rem"
  xl: "4rem"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-text}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1rem"
    height: "2.75rem"
  button-secondary:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1rem"
    height: "2.75rem"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.7rem"
    height: "2.75rem"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "{spacing.md}"
  badge:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.text-muted}"
    rounded: "{rounded.sm}"
    padding: "0.15rem 0.4rem"
---

# Design System: Rigid UI documentation

## Overview

**Creative North Star: "The Working Reference"**

Rigid UI reads like documentation built beside the code. Warm neutral surfaces, near-black accents, compact labels, and fine borders keep attention on examples and API facts. The system is quiet but not soft. Its dense navigation and precise type make it feel dependable.

The styled Components catalog and unstyled Primitives catalog share one shell but teach different things. Component pages use grouped recipes, generous previews, and source disclosure familiar to shadcn/ui users. Primitive pages favor Base UI-like import and anatomy references. Copy must stay honest about the planned registry: recipes live in the demo today and are not yet installable from a registry.

**Key Characteristics:**

- A single ruled grid: two rails, hairline bands, and no space between them
- Warm neutral canvases with near-black text and actions
- Dense, persistent desktop navigation with a compact mobile catalog switcher
- Large editorial page titles set against small technical labels and monospace code
- Square page structure, restrained elevation, and short state transitions
- First-class light and dark themes with the same hierarchy in both

## Colors

The palette is almost monochrome. Semantic green, amber, red, and teal appear only when status, danger, or focus needs a distinct signal.

### Primary

- **Ink:** The main action, strongest text, selected mark, and tooltip fill. Its rarity gives actions their weight.
- **Soft Ink:** The hover state for ink actions. It changes tone without changing the page's visual temperature.

### Secondary

- **Focus Teal:** Keyboard focus rings and selection feedback. Keep it functional rather than decorative.
- **Danger Rose:** Destructive actions, invalid fields, and failure badges.
- **Success Green:** Healthy and completed states.
- **Warning Ochre:** Paused or cautionary states.

### Neutral

- **Warm Paper:** The page canvas.
- **Muted Paper:** Quiet bands and secondary canvas regions.
- **Clean Surface:** Cards, fields, previews, and raised content.
- **Sunken Surface:** Disabled controls and neutral badge fills.
- **Interactive Wash:** Hover and selected navigation backgrounds.
- **Muted Graphite:** Supporting prose and inactive navigation.
- **Subtle Graphite:** Version text, metadata, and the least prominent labels.
- **Hairline:** The default divider and container border.
- **Strong Hairline:** Hovered borders and understated link underlines.
- **Code Ink:** Dark source blocks paired with warm-white code text, plus a muted variant for asides on that surface.

**The Ink Is Earned Rule.** Use the near-black accent for primary actions and decisive state. Do not spread it across decorative regions.

**The Theme Parity Rule.** Dark mode changes token values, not information hierarchy. The same elements remain primary, muted, bordered, or raised.

## Typography

**Display Font:** Inter with the system sans-serif stack

**Body Font:** Inter with the system sans-serif stack

**Label/Mono Font:** The platform monospace stack

**Character:** One sans-serif family carries the interface, with tight tracking and carefully stepped weights doing most of the hierarchy work. Monospace marks imports, paths, versions, source controls, and primitive anatomy.

### Hierarchy

- **Display:** Heavy, tightly tracked type for the home hero only. Keep the line short, about 11 characters wide at most.
- **Headline:** Large page titles for component and primitive documentation.
- **Title:** Compact section headings and card titles. Use weight before size to establish hierarchy.
- **Entry:** The name in a catalog row or list item, a step above body so a scannable list of links keeps its own weight.
- **Body:** Supporting documentation copy with a relaxed line height and a practical maximum width around 42 to 46rem.
- **Label:** Navigation, button text, preview headings, badges, and metadata.
- **Mono:** Imports, code, file paths, package names, version strings, and source disclosure.

**The Technical Accent Rule.** Monospace is a semantic cue for code and package identity. Do not use it as general decoration.

## Layout

The site is drawn on one structural grid. Two vertical rails mark the edges of an 80rem content
column and run unbroken from the header to the footer; the space outside them is bare canvas. Every
region between the rails is a band: full column width, separated from its neighbours by a single
hairline, and carrying its padding on the inside. Nothing in the frame has an outer margin, which is
what keeps the rails continuous — a `gap` or a `margin` in the stack shows up as a break in a line.

The sticky header is 3.75rem tall and its cells are parted by the same hairlines. The first header
cell is 14rem wide, so its trailing rule is the top of the sidebar rail: one line runs from the top
of the page to the bottom of the documentation column. Catalog pages add that 14rem sidebar at 64rem
and wider; the sidebar is fixed below the header and scrolls independently. Below 64rem the sidebar
is replaced by a horizontally scrollable Components and Primitives switcher in its own band. The
primary header navigation appears at 42rem.

Bands set their own internal rhythm. The home hero splits into two cells at 58rem and the two
catalog lanes split at 48rem, each split drawn as a vertical rule rather than a gutter. Documentation
pages open with a masthead band holding the title and lede, then stack one band per section. Component
previews centre their specimen in a stage at least 18rem tall. Where a grid has to rule between cells
whose count varies, draw the rules as 1px gaps over a hairline-coloured container rather than as
per-cell borders, so no cell has to know whether it sits in the last row or column.

**The Unbroken Rail Rule.** The two vertical rails and the hairlines between bands are the layout.
Space belongs inside a cell, never between two of them.

**The Two Catalogs Rule.** Components and Primitives remain visible as separate routes and navigation groups. Never collapse their content into an ambiguous single list.

**The Dense Edge, Open Page Rule.** Keep navigation compact. Give examples and reading content enough horizontal and vertical room to scan without crowding.

## Elevation & Depth

The system is flat at page level. The grid's hairlines, canvas changes, and sunken fills define all
page structure. A small 1px shadow supports buttons and cards. Medium and large shadows belong to floating popovers, tooltips, and modal dialogs, where the layer must separate from the document.

### Shadow Vocabulary

- **Low:** A quiet 1px shadow for bordered buttons and cards at rest.
- **Floating:** A broad, soft shadow for popovers and tooltips.
- **Modal:** The strongest shadow, paired with a dark backdrop for dialogs.

**The Floating Layers Rule.** Broad shadows indicate content that escaped document flow. Do not use them on ordinary page sections or preview frames.

## Shapes

Page structure is square. Bands, previews, source regions, catalog rows, and the header and sidebar
cells all meet at right angles, because a radius would put a gap between two rules that are meant to
join. Radii belong to the objects inside a band: compact controls and badges use the small radius,
inputs and normal buttons the medium radius, cards and floating panels the large radius. Pills are
reserved for genuinely circular or capsule-shaped elements.

One-pixel borders are the only structural line, and they are shared: a band's bottom rule is the next
band's top rule.

**The Radius Follows Scale Rule.** Small object, small corner. Large container, larger corner. Avoid a single oversized radius across every element.

## Components

### Buttons

- **Shape:** Compact and gently rounded, with sizes from 2.25rem to 3rem. Coarse pointers raise the smallest controls to at least 2.75rem.
- **Primary:** Near-black fill, white text, matching border, and the low shadow.
- **Secondary:** White surface, hairline border, dark text, and the low shadow.
- **Outline and Ghost:** Transparent at rest. Hover adds the interactive wash; outline also strengthens its border.
- **Danger:** Rose fill and matching border with light text.
- **Hover / Focus:** Change color in 120ms. Focus uses a 2px teal outline with offset. Active buttons compress to 97.5%. Disabled buttons retain their shape at 52% opacity.

### Badges

- **Style:** Small rectangular labels with a 5px radius, 11px type, and a fine border.
- **State:** Neutral badges use the sunken surface. Semantic badges mix 14% of their tone into the card surface, then use a stronger same-hue border.
- **Mono:** Use for package imports, counts, and code-like metadata.

### Bands

- **Header:** An optional label strip opens a band — 11px uppercase sans in muted text, with an
  optional monospace note on the right for a path, an axis list, or a count.
- **Border:** The band's own bottom hairline, plus the frame's rails on either side. No radius, no
  shadow, and no border of its own on the sides.
- **Internal Padding:** The shared inline inset on every cell that holds text, and 0.6 to 1.25rem of
  block padding depending on whether the band is a label strip, a row, or a masthead.

### Cards / Containers

Cards are for content inside a band and inside the component catalog, not for page structure.

- **Corner Style:** Gently curved, using the large radius.
- **Background:** Clean surface over the page canvas.
- **Shadow Strategy:** Low shadow only. Floating components use the stronger elevation vocabulary.
- **Border:** One hairline around the container, with optional internal dividers.
- **Internal Padding:** Usually 1rem, tightened to 0.75 to 0.85rem for headers and footers.

### Inputs / Fields

- **Style:** White surface, hairline border, medium radius, and 14px text. Textareas share the same dimensions and state language.
- **Focus:** Teal border plus a 2px teal outline with a 1px offset.
- **Error / Disabled:** Invalid fields turn the border rose. Disabled fields use the sunken surface and 60% opacity.

### Navigation

The header and desktop sidebar use compact 13px links. Header links fill the full height of the bar
and are parted by vertical rules, so hover fills a cell rather than a floating pill. Hover moves muted
text to full contrast and adds the interactive wash. The current sidebar page adds the wash, a
slightly stronger weight, and a 2px ink marker on its leading edge. Mobile keeps only the
catalog-level switcher below the sticky header, allowing horizontal scroll rather than wrapping.

### Example frames

Examples are the main teaching unit for styled components. An example is a band, not a card: a label
strip, an optional note, a roomy centred preview on the muted canvas, and a native disclosure for
source. Source opens onto the dark code surface, full width between the rails. Do not imply that the
displayed recipe is available through the planned registry.

### Primitive references

Primitive pages stack an Import band, whose code line runs full width on the dark code surface, and an
Anatomy band listing each namespaced part on its own ruled row. Keep this reference format factual and
compact.

### Floating content

Popovers and dialogs use raised surfaces, hairline borders, the large radius, and 180ms opacity and scale transitions. Tooltips invert to ink with light text and use the faster 120ms transition. All motion stops under reduced-motion preferences.

## Do's and Don'ts

### Do:

- **Do** keep Components and Primitives visually related but structurally separate.
- **Do** use the grid's hairlines and tonal changes before reaching for borders of their own or shadows.
- **Do** reserve monospace for imports, source, paths, versions, and anatomy names.
- **Do** preserve focus outlines, coarse-pointer target sizes, and reduced-motion behavior.
- **Do** say that the registry is planned and point readers to the demo source that exists today.

### Don't:

- **Don't** present the styled recipes as installable registry packages before that registry ships.
- **Don't** turn semantic teal, green, amber, or rose into broad decorative color.
- **Don't** hide the catalog split inside one undifferentiated navigation tree.
- **Don't** add large shadows to normal documentation sections.
- **Don't** put a margin, a gap, or a radius between two regions of the frame.
- **Don't** replace the dense desktop sidebar with oversized marketing navigation.
