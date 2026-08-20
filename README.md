# rigid-ui

Unstyled UI components for Solid 2. Based on [Base UI](https://base-ui.com/).

Library: `packages/rigid-ui`. Demo: `apps/demo`. Publish from `packages/rigid-ui` (`pnpm --filter rigid-ui publish`).

## Development

`pnpm dev` starts the demo, `pnpm ready` runs the full gate (library build, check, both test suites, demo build). Individual steps: `pnpm build`, `pnpm test:run`, `pnpm test:chromium`, `pnpm build:site`.

The demo imports `rigid-ui/*` through the package's published `exports` map — not through a source alias — so every demo build and type check exercises the packaged artifact and a broken export map fails the build. The trade-off is that `dist` is a prerequisite: run `pnpm build` before `vp check` or `pnpm dev` on a fresh clone. The task graph handles this automatically (`demo#build` and `demo#dev` depend on the library's `build`), so prefer `pnpm dev` and `pnpm build:site` over the bare `vp dev` / `vp build` built-ins, which bypass task dependencies.

While working on the library, run `pnpm --filter rigid-ui dev` (`vp pack --watch`) alongside the demo so changes to `src` propagate.

## Components ported

- **ScrollArea** — a container with native scroll and stylable scrollbars.

## Components not ported

- Anything else from BaseUI. I just needed the ScrollArea, but maybe I'll add more later.

## Usage

```typescript
import { ScrollArea } from "rigid-ui/scroll-area";
```

## Notes

- I didn't port the `useRender` utility for polymorphic components. The scroll area components are just divs.
- Requires Solid 2 RC (`solid-js` and `@solidjs/web` `^2.0.0-rc.0`).

## Credits

This project tries to port some of great code from [Base UI](https://base-ui.com/), an unstyled React component library.
