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
  docs-title:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  docs-title-mobile:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "2rem"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  docs-lede:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.7
  docs-section:
    fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.4rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "-0.02em"
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

- A ruled homepage and shared header, with open reading space on documentation pages
- Warm neutral canvases with near-black text and actions
- Dense, persistent desktop navigation with a native mobile documentation disclosure
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

The homepage uses an 80rem frame with two vertical rails. Full-width bands share hairlines and
carry their padding inside each cell. The home hero splits into two cells at 58rem and the two
catalog lanes split at 48rem, with vertical rules between cells. Where cell counts vary, draw rules
as 1px gaps over a hairline-coloured container.

The shared sticky header is 3.75rem tall, with hairlines between its cells. Its first cell is 14rem
wide at 64rem and wider. Primary header navigation appears at 42rem. The header and footer retain
the homepage frame on documentation routes.

Documentation has an open layout within the same 80rem maximum width. At 64rem and wider, a 13rem
sticky sidebar sits beside the reading area with a 2rem gap and 1.5rem outer inline padding. The
sidebar scrolls independently below the header. Prose has a 46rem maximum width, with 3rem of space
above the page and 6rem below. Sections use heading margins rather than full-width bordered bands.
At 76rem and wider, a 9rem contents column appears beside the article, separated by a 3rem gap.

Below 64rem, a native disclosure labelled "Browse documentation" replaces the sidebar and contains
the full navigation. The article centres within its 46rem maximum width. Below 40rem, inline padding
shrinks to 1.25rem, top padding to 2rem, and catalog lists become a single column.

**The Unbroken Rail Rule.** Keep the homepage's adjacent bands and shared header cells joined by
hairlines. Documentation articles use gaps and padded prose; they do not extend the header's cell
rules down the page.

**The Two Catalogs Rule.** Components and Primitives remain visible as separate routes and navigation groups. Never collapse their content into an ambiguous single list.

**The Dense Edge, Open Page Rule.** Keep navigation compact. Give examples and reading content enough horizontal and vertical room to scan without crowding.

## Elevation & Depth

The system is flat at page level. Homepage bands use hairlines and canvas changes; documentation
uses whitespace and heading hierarchy, with borders around examples and code containers. A small 1px shadow supports buttons and cards. Medium and large shadows belong to floating popovers, tooltips, and modal dialogs, where the layer must separate from the document.

### Shadow Vocabulary

- **Low:** A quiet 1px shadow for bordered buttons and cards at rest.
- **Floating:** A broad, soft shadow for popovers and tooltips.
- **Modal:** The strongest shadow, paired with a dark backdrop for dialogs.

**The Floating Layers Rule.** Broad shadows indicate content that escaped document flow. Do not use them on ordinary page sections or preview frames.

## Shapes

The homepage frame, bands, and shared header cells meet at right angles so their rules join.
Documentation previews are separate bordered containers with the large radius. Code blocks use the
medium radius, and sidebar links have small rounded corners. Compact controls and badges use the
small radius, inputs and normal buttons the medium radius, and cards and floating panels the large
radius. Pills are reserved for circular or capsule-shaped elements.

Structural borders are one pixel. Adjacent homepage bands share a rule; documentation preview
frames have their own complete border.

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

### Homepage bands

- **Header:** An optional label strip opens a band — 11px uppercase sans in muted text, with an
  optional monospace note on the right for a path, an axis list, or a count.
- **Border:** The band's own bottom hairline, plus the frame's rails on either side. No radius, no
  shadow, and no border of its own on the sides.
- **Internal Padding:** The shared inline inset on every cell that holds text, and 0.6 to 1.25rem of
  block padding depending on whether the band is a label strip, a row, or a masthead.

### Cards / Containers

Cards hold examples and component content. Documentation prose stays on the page canvas.

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

The header and desktop sidebar use compact 13px links. Header links fill the bar's height and share
vertical rules. Hover fills the header cell. Sidebar links have rounded corners and use the
interactive wash on hover and for the current page. The current page also uses a stronger weight.
Mobile navigation uses a native disclosure containing Introduction, Components, and Primitives,
including individual pages. The open list scrolls within 60dvh.

### Documentation prose

MDX pages use a title, introductory paragraph, and ordinary section headings. Titles are 2.25rem on
desktop and 2rem below 40rem. Article text is 0.9375rem with a 1.8 line height; the introduction is
slightly larger and muted. Second-level headings have 3rem above them. Anchor targets leave room
for the sticky header. Tables and code blocks scroll horizontally when needed.

### Example frames

Examples are separate rounded frames with a hairline border and 1.5rem of vertical margin. An
optional note sits above a centred preview at least 18rem tall. A native "View code" disclosure
opens the dark source region within the frame. Section headings live in the surrounding prose.
Do not imply that the displayed recipe is available through the planned registry.

### Primitive references

Primitive pages use ordinary Import and Anatomy sections within the article. Imports appear in
bounded dark code blocks; anatomy shows namespaced parts in a composition example. Keep descriptions factual and
compact, with examples separate from the reference prose.

### Floating content

Popovers and dialogs use raised surfaces, hairline borders, the large radius, and 180ms opacity and scale transitions. Tooltips invert to ink with light text and use the faster 120ms transition. All motion stops under reduced-motion preferences.

## Do's and Don'ts

### Do:

- **Do** keep Components and Primitives visually related but structurally separate.
- **Do** preserve the homepage hairlines and use whitespace to separate documentation sections.
- **Do** reserve monospace for imports, source, paths, versions, and anatomy names.
- **Do** preserve focus outlines, coarse-pointer target sizes, and reduced-motion behavior.
- **Do** say that the registry is planned and point readers to the demo source that exists today.

### Don't:

- **Don't** present the styled recipes as installable registry packages before that registry ships.
- **Don't** turn semantic teal, green, amber, or rose into broad decorative color.
- **Don't** hide the catalog split inside one undifferentiated navigation tree.
- **Don't** add large shadows to normal documentation sections.
- **Don't** put a margin, gap, or radius between adjacent homepage bands or shared header cells.
- **Don't** replace the dense desktop sidebar with oversized marketing navigation.
