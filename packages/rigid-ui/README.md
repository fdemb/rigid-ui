# rigid-ui

Unstyled UI components for Solid 2. Based on [Base UI](https://base-ui.com/).

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
