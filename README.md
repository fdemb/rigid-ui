# Rigid UI

[![npm](https://img.shields.io/npm/v/rigid-ui)](https://www.npmjs.com/package/rigid-ui)
[![license](https://img.shields.io/npm/l/rigid-ui)](./LICENSE)

Copy-owned, StyleX-styled components for Solid 2, backed by accessible primitives from the `rigid-ui` package. The primitives follow the compound component APIs of [Base UI](https://base-ui.com/) while using Solid's reactivity and native browser behavior.

[Explore the components](https://fdemb.github.io/rigid-ui/components) · [Read the primitive docs](https://fdemb.github.io/rigid-ui/primitives)

> [!NOTE]
> Rigid UI targets the Solid 2 release candidate. APIs may change before the first stable release.

## Install

```bash
pnpm add rigid-ui
```

Rigid UI requires `solid-js` and `@solidjs/web` version `^2.0.0-rc.0`.

## Use a primitive

Import each primitive from its explicit subpath. Primitives have no default styles. The demo composes them into registry-style components whose StyleX source is intended to live in the user's application.

```tsx
import { Popover } from "rigid-ui/primitives/popover";

export function Notifications() {
  return (
    <Popover.Root>
      <Popover.Trigger>Notifications</Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner sideOffset={8}>
          <Popover.Popup>
            <Popover.Title>Notifications</Popover.Title>
            <Popover.Description>You are all caught up.</Popover.Description>
            <Popover.Close>Close</Popover.Close>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
```

Parts that render DOM elements accept `class` and `style`. State attributes such as `data-open`, `data-closed`, `data-starting-style`, and `data-ending-style` let CSS respond to component state and transitions.

Use the `render` prop to replace a DOM part's default element with a tag, a component, or a callback. The callback receives the props that Rigid UI needs you to forward.

## Primitives

| Component    | Import                             | Purpose                                                    |
| ------------ | ---------------------------------- | ---------------------------------------------------------- |
| Alert Dialog | `rigid-ui/primitives/alert-dialog` | Interrupts the user to confirm a consequential action.     |
| Dialog       | `rigid-ui/primitives/dialog`       | Displays modal or non-modal content above the page.        |
| Popover      | `rigid-ui/primitives/popover`      | Positions interactive content next to a trigger.           |
| Scroll Area  | `rigid-ui/primitives/scroll-area`  | Keeps native scrolling while exposing stylable scrollbars. |
| Tooltip      | `rigid-ui/primitives/tooltip`      | Shows contextual information on hover or keyboard focus.   |
| Separator    | `rigid-ui/primitives/separator`    | Separates content with horizontal or vertical semantics.   |

The package also exports `CSPProvider`, `DirectionProvider`, and `mergeProps` from their respective `rigid-ui/primitives/*` subpaths.

## Develop locally

This repository uses [Vite+](https://viteplus.dev/) and pnpm.

```bash
vp install
pnpm dev
```

Run the full check before submitting a change:

```bash
pnpm ready
```

`pnpm ready` builds the library, checks formatting and types, runs the JSDOM and Chromium test suites, builds the demo, and checks the compiled documentation routes. The demo imports through the published `exports` map, so the library build must exist before you run the demo or its type check.

## Documentation

Documentation pages live in `apps/demo/src/docs` as MDX. Put prose and code samples there, and import live Solid examples from `apps/demo/src/examples`. Each page supplies its title and section headings to `DocPage`, which renders the reading column and contents links.

The Vite pipeline preserves MDX's JSX, then compiles it with the Solid 2 plugin. `components/mdx.tsx` maps Markdown tags to Solid components because Solid 2 cannot render MDX's default string component mappings. `DocsLayout` supplies documentation navigation through nested routes; `Layout` owns the shared header, footer, and theme.

Check every documentation route against the production bundle without opening a browser:

```bash
vp run demo#test:docs
```

The check builds the demo, then uses JSDOM to verify page rendering, heading links, client navigation, and the dialog example. It also accepts a build configured for the GitHub Pages base path.

## Credits

Rigid UI adapts APIs and behavioral tests from [Base UI](https://base-ui.com/), an unstyled React component library maintained by MUI.

## License

[MIT](./LICENSE)
