# rigid-ui

Unstyled UI components for Solid 2, ported from [Base UI](https://base-ui.com/).

```sh
pnpm add rigid-ui
```

Requires the Solid 2 RC: `solid-js` and `@solidjs/web` at `^2.0.0-rc.0`.

## Components

| Component    | Import                  | Parts                                                                                                  |
| ------------ | ----------------------- | ------------------------------------------------------------------------------------------------------ |
| Scroll Area  | `rigid-ui/scroll-area`  | Root, Viewport, Scrollbar, Thumb, Content, Corner                                                      |
| Dialog       | `rigid-ui/dialog`       | Root, Trigger, Portal, Backdrop, Popup, Viewport, Title, Description, Close, Handle                    |
| Alert Dialog | `rigid-ui/alert-dialog` | Same parts as Dialog, with its own Root and Trigger                                                    |
| Popover      | `rigid-ui/popover`      | Root, Trigger, Portal, Backdrop, Positioner, Popup, Viewport, Arrow, Title, Description, Close, Handle |
| Tooltip      | `rigid-ui/tooltip`      | Provider, Root, Trigger, Portal, Positioner, Popup, Viewport, Arrow, Handle                            |

Two helpers ship alongside them: `rigid-ui/csp-provider`, which feeds a nonce to the style
elements the scroll area injects, and `rigid-ui/merge-props`. Nothing else from Base UI is ported
yet.

## Usage

```tsx
import { Popover } from "rigid-ui/popover";

<Popover.Root>
  <Popover.Trigger>Notifications</Popover.Trigger>
  <Popover.Portal>
    <Popover.Positioner sideOffset={8}>
      <Popover.Popup>
        <Popover.Arrow />
        <Popover.Title>Notifications</Popover.Title>
        <Popover.Description>You are all caught up.</Popover.Description>
        <Popover.Close>Close</Popover.Close>
      </Popover.Popup>
    </Popover.Positioner>
  </Popover.Portal>
</Popover.Root>;
```

Anchored popups position through Floating UI (`@floating-ui/dom`), so the resolved side and
alignment come back as `data-side` and `data-align` on the positioner and popup, along with the
`--available-width`, `--available-height`, and `--transform-origin` custom properties.

## Polymorphism

Every part takes a `render` prop, which accepts a tag name, a component, or a callback
`(props, state) => JSX.Element`. The callback receives the part's state, so you can branch on it.
Merge your own props in with `mergeProps` rather than spreading over `props`, and set
`nativeButton={false}` when the result is not a `<button>`, so the part supplies `role="button"`,
a tab index, and Enter/Space activation itself.

```tsx
import { mergeProps } from "rigid-ui/merge-props";

<Popover.Trigger
  nativeButton={false}
  render={(props, state) => (
    <a {...mergeProps(props, { class: "trigger" })} href="#more">
      {state.open ? "Hide" : "Show"}
    </a>
  )}
/>;
```

A tag name does not widen the part's prop types. `<Popover.Trigger render="a" href="...">` does
not typecheck, because the props type still describes a `<button>`. Put the extra attributes on
the element the callback returns.

## Credits

The behavior and the test coverage are ported from [Base UI](https://base-ui.com/), an unstyled
React component library. Licensed MIT, same as this project.
