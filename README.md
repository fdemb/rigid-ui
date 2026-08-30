# rigid-ui

Unstyled UI components for Solid 2, ported from [Base UI](https://base-ui.com/).

Library: `packages/rigid-ui`. Demo: `apps/demo`. Publish from `packages/rigid-ui`
(`pnpm --filter rigid-ui publish`). Contributor guide: [AGENTS.md](./AGENTS.md).

## Components

| Component    | Import                  |
| ------------ | ----------------------- |
| Scroll Area  | `rigid-ui/scroll-area`  |
| Dialog       | `rigid-ui/dialog`       |
| Alert Dialog | `rigid-ui/alert-dialog` |
| Popover      | `rigid-ui/popover`      |
| Tooltip      | `rigid-ui/tooltip`      |

Two helpers ship alongside them: `rigid-ui/csp-provider` and `rigid-ui/merge-props`. Nothing else
from Base UI is ported yet.

```tsx
import { Popover } from "rigid-ui/popover";

<Popover.Root>
  <Popover.Trigger>Notifications</Popover.Trigger>
  <Popover.Portal>
    <Popover.Positioner sideOffset={8}>
      <Popover.Popup>
        <Popover.Arrow />
        <Popover.Title>Notifications</Popover.Title>
      </Popover.Popup>
    </Popover.Positioner>
  </Popover.Portal>
</Popover.Root>;
```

Every part takes a `render` prop for polymorphism, which accepts a tag name, a component, or a
callback `(props, state) => JSX.Element`.

Requires the Solid 2 RC: `solid-js` and `@solidjs/web` at `^2.0.0-rc.0`.

## Development

`pnpm dev` starts the demo. `pnpm ready` runs the full gate: library build, `vp check`, both test
suites, demo build. The individual steps are `pnpm build`, `pnpm test:run`, `pnpm test:chromium`,
and `pnpm build:site`.

The demo imports `rigid-ui/*` through the package's published `exports` map rather than a source
alias, so every demo build and type check exercises the packaged artifact, and a broken export map
fails the build. The trade-off is that `dist` is a prerequisite: run `pnpm build` before
`vp check` or `pnpm dev` on a fresh clone. The task graph handles this automatically (`demo#build`
and `demo#dev` depend on the library's `build`), so prefer `pnpm dev` and `pnpm build:site` over
the bare `vp dev` and `vp build` built-ins, which bypass task dependencies.

While working on the library, run `pnpm --filter rigid-ui dev` (`vp pack --watch`) alongside the
demo so changes to `src` propagate.

## Credits

The behavior and the test coverage are ported from [Base UI](https://base-ui.com/), an unstyled
React component library. Licensed MIT, same as this project.
