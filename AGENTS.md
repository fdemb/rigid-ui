# Contributing to rigid-ui

Unstyled component parts for Solid 2, ported from [Base UI](https://base-ui.com/).

The aim is a library Solid 2 apps can build on without fighting it. We follow Base UI's public
API closely, because it is the most actively maintained take on this kind of library, and fall
back on Radix UI's older API where Base UI has no answer. Where the two disagree, Base UI wins.

Native browser features are preferred when they pay for themselves. Anchored popups are the
exception. They use Floating UI (`@floating-ui/dom`, the vanilla build) through the
`createAnchorPositioning` composable, because CSS anchor positioning cannot report the resolved
placement back to JS, and the resolved placement is part of our public API.

Work lands on `main`. The `solid-1` branch holds the old Solid 1.x code, which only ever had the
scroll area and is no longer maintained.

## Layout

| Path                | What it is                                                   |
| ------------------- | ------------------------------------------------------------ |
| `packages/rigid-ui` | The library. Published to npm as `rigid-ui`.                 |
| `apps/demo`         | The demo site, one page per component.                       |
| `reference/base-ui` | A checkout of Base UI, read when porting behavior and tests. |

## Components

Every component ships as a namespace of parts, the same shape Base UI uses.

- **Scroll Area** (`rigid-ui/scroll-area`). Root, Viewport, Scrollbar, Thumb, Content, Corner.
- **Dialog** (`rigid-ui/dialog`). Root, Trigger, Portal, Backdrop, Popup, Viewport, Title,
  Description, Close, plus `Handle` and `createHandle` for detached triggers.
- **Alert Dialog** (`rigid-ui/alert-dialog`). Its own Root and Trigger; the remaining parts are
  re-exported from Dialog.
- **Popover** (`rigid-ui/popover`). Root, Trigger, Portal, Backdrop, Positioner, Popup, Viewport,
  Arrow, Title, Description, Close, Handle.
- **Tooltip** (`rigid-ui/tooltip`). Provider, Root, Trigger, Portal, Positioner, Popup, Viewport,
  Arrow, Handle.

Two helpers ship alongside them: `rigid-ui/csp-provider`, which feeds a nonce to the style
elements the scroll area injects, and `rigid-ui/merge-props`, our props merger. `DirectionProvider`
lives in `src/direction-provider` but has no entry in the package's `exports` map yet, so it is
not reachable from outside the package.

Nothing else from Base UI is ported. Menu, Select, Combobox, and Toolbar do not exist here, which
is why a handful of their integration tests are listed as inapplicable below.

Requires the Solid 2 RC: `solid-js` and `@solidjs/web` at `^2.0.0-rc.0`.

## Getting started

```sh
vp install        # or pnpm install
pnpm build        # builds packages/rigid-ui into dist
pnpm dev          # serves apps/demo
```

`packages/rigid-ui/dist` is a prerequisite for both type checking and the demo. `apps/demo`
imports the library through its published `exports` map rather than a source alias, so every demo
build checks that the packaged artifact is intact and a broken export map fails the build. The
task graph already knows this (`demo#build` and `demo#dev` depend on the library's `build`), so
prefer `pnpm dev` and `pnpm build:site` over the bare `vp dev` and `vp build` built-ins, which
skip task dependencies.

When you are changing the library and watching the demo at the same time, run
`pnpm --filter rigid-ui dev` (`vp pack --watch`) alongside it so `src` changes propagate.

## Checks

`pnpm ready` is the gate a PR has to pass. Run it before you open one.

| Command              | What it runs                  |
| -------------------- | ----------------------------- |
| `pnpm ready`         | Everything below, in order.   |
| `pnpm build`         | `vp pack` for the library.    |
| `vp check`           | Format, lint, and type check. |
| `pnpm test:run`      | The JSDOM suite.              |
| `pnpm test:chromium` | The Chromium suite.           |
| `pnpm build:site`    | The demo build.               |

Commits follow [Conventional Commits](https://www.conventionalcommits.org/), scoped by component:
`feat(tooltip): support cursor tracking`.

## Testing

Coverage is ported from Base UI's, which is the most thorough suite of any library in this space.
That is what `reference/base-ui` is for.

Tests run in two environments. `VITEST_ENV=jsdom` covers everything that does not need real
layout. `VITEST_ENV=chromium` covers layout, overflow, `ResizeObserver`, and pointer geometry.
Reach for the Chromium run instead of mocking browser measurements into JSDOM.

Shared setup and fixtures live in `packages/rigid-ui/test`. Use them rather than writing a
component-specific render or cleanup helper.

### Porting a component from Base UI

1. Find every Base UI test file for the component under `reference/base-ui/packages/react/src/`.
2. Inventory the behavioral contracts, and sort them into JSDOM-safe and browser-layout piles.
3. Port them with `@solidjs/testing-library`. Leave React-only renderer, ref, and lifecycle
   semantics behind.
4. Keep Base UI's observable assertions: DOM attributes, CSS variables, events, scrolling, sizing,
   direction, and unmount safety.
5. Treat a failing ported test as an implementation gap. Fix the component rather than weakening
   or skipping the contract.
6. Give genuinely inapplicable cases a row in the tables at the end of this file, with the Solid
   or public-API difference that makes them inapplicable.
7. Run `pnpm ready`.

Before you decide a ported test has found a bug, read the hazards below. Most of them have bitten
us at least once.

## Gap tracking

Open gaps, unported test clusters, and the record of past fixes are Linear issues in the
[Rigid UI team](https://linear.app/rigid-ui-fdemb/team/RUI), labeled by component: `Scroll Area`,
`Dialog`, `Alert Dialog`, `Popover`, `Tooltip`.

Search there before auditing a component against `reference/base-ui/` again. The audit has already
happened once and the findings are written down. Each open issue names the Base UI test that
encodes the contract, so the loop is: port that test, fix the component, close the issue. Cases we
deliberately do not port get a table row here instead of an issue.

## Solid hazards

- **A signal write is not visible to a read until the next flush.** `setFoo(x)` followed by a
  synchronous `foo()` still returns the old value. In tests, use a plain variable for anything a
  callback reads and the test mutates mid-run. In components, never read back a signal you just
  wrote in order to make a decision. Four separate defects came from this one hazard.
- **A `delay={0}` hover timer is a macrotask.** `await flushMicrotasks()` does not advance it, so
  a test asserting "hover did not open the popover" passes whether or not the guard works. Wait a
  real tick. See `settleHoverDelay` in `PopoverTrigger.test.tsx`.
- **Positioning is async.** The positioner is `opacity: 0` until its first pass lands, so
  assertions on popup visibility have to `await`. Base UI behaves the same way; their awaited
  `render` hides it.
- **Object-spreading a getter bag freezes it.** `{...bag}` copies getter _results_, so a bag from
  `renderElement` or `renderPart` loses its reactivity the moment it is spread into a plain
  object. Use `merge` from `solid-js`, or pass the bag itself, wherever a bag has to become
  another object. Destructuring a rest object out of one does the same damage.
- **Solid's `omit` freezes the key set unless the source is a Solid proxy.** Given a plain object
  or a hand-rolled proxy it copies the descriptors it can see _once_, so a key that appears later,
  such as a state attribute switching on, never shows up. Use `omitProps` from
  `internals/mergeProps` when the source is one of our bags.
- **`in` on a merged props proxy is an untracked read.** `"class" in props` resolves the
  function-backed sources of a Solid `merge` proxy, which both warns (`STRICT_READ_UNTRACKED`) and
  makes the decision once. Never branch on the presence of a prop in a component body. Define the
  getter unconditionally and let it resolve to `undefined`.
- **A component's `render` prop must be read once, untracked.** Every read of a JSX element in a
  prop position rebuilds it, and a component render prop is re-invoked per read. `children()` does
  not help, because outside a tracking scope it recomputes on each read.
- **Do not destructure the payload render prop.** `{({ payload }) => …}` freezes the value,
  because the render prop receives a real props object. Write `{(state) => … state.payload}`. This
  is the ordinary "don't destructure props" rule, and `solid/no-destructure`-style lints catch it.
- **JSDOM's `scrollTop` and `scrollLeft` setters are no-ops** on elements it deems unscrollable,
  so Base UI's `fireEvent.scroll(el, { target: { scrollTop: 1 } })` silently does nothing. Use
  `scrollViewport` from `test/ScrollAreaFixture.tsx`, which redefines the property and dispatches
  the event by hand.
- **Unmounting from an event handler is async.** Base UI's unmount-safety tests use
  `ReactDOM.flushSync`; the Solid ports set a signal and `await flushMicrotasks()` before asserting
  the part is gone. The contract still holds, that an in-flight gesture does not throw against a
  torn-down tree, and each port also fires a follow-up event at the detached node.

## The `render` prop

`render` accepts a tag name, a component, or a callback `(props, state) => JSX.Element`. The
implementation is `internals/renderPart.ts`.

Every part that has state passes it to `renderPart` and threads its `State` type through its
props, so the callback's second argument is typed and live. Parts whose Base UI counterpart has no
state (`Title`, `Description`, `Portal`, `ScrollArea.Corner`) receive `{}`.

One limit is deliberate: a tag name does not widen the part's prop types.
`<Popover.Trigger render="a" href="…">` does not typecheck, because the props type still describes
a `<button>`. Put the extra attributes on the element the callback returns. Base UI has the same
limitation.

## `nativeButton`

`nativeButton` is wired through `useButton` into `Popover.Trigger`, `Popover.Close`,
`Dialog.Trigger`, and `Dialog.Close`, the same four parts Base UI wires. It defaults to `true`.
Set it to `false` when `render` produces something other than a `<button>`, and the part applies
`role="button"`, a tab index, and Enter/Space activation instead of assuming native semantics.
Leaving it `true` on a non-button logs a dev warning.

`Tooltip.Trigger` does not use `useButton`, matching Base UI. Its `disabled` prop disables the
tooltip, not the button.

## Deliberate differences from Base UI

These are choices, not gaps, so they have no Linear issue.

- `resolveInstantType` guards with `event instanceof MouseEvent` before reading `detail`, where
  Base UI casts unconditionally. Same outcome on every real path, without the `undefined === 0`
  accident.

## Base UI cases we do not port

### Shared

| Base UI case                                    | Why it does not apply                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `describeConformance`, `nativeButton`           | React renderer concepts; Solid composition differs. Replaced with an explicit props/class/style/ref forwarding test per part                                                                                                                                                                                                                                                                                   |
| `render` given a JSX element (`render={<a />}`) | Solid evaluates a JSX element in a prop position eagerly, through a getter that rebuilds it on every read, and the consumer's own reactive bindings own the resulting attributes, so a later flush overwrites anything we merge in. Under SSR it compiles to an opaque HTML string with nothing to merge into. The tag, component, and callback forms of `render` are supported; see `internals/renderPart.ts` |
| React ref and lifecycle semantics               | N/A                                                                                                                                                                                                                                                                                                                                                                                                            |
| `expect(...).toThrow()` on render-time errors   | An uncaught throw halts Solid's reactive system for the rest of the module. Capture with an `<Errored>` boundary instead, see `PopoverPositioner.test.tsx`                                                                                                                                                                                                                                                     |

### Popover

| Base UI case                                                                                | Why it does not apply             |
| ------------------------------------------------------------------------------------------- | --------------------------------- |
| Toolbar composite-key tests (`does not relay composite keys from the popup to the toolbar`) | No Toolbar component              |
| Nested Combobox and Menu integration                                                        | Those components do not exist yet |

### Dialog

| Base UI case                                  | Why it does not apply             |
| --------------------------------------------- | --------------------------------- |
| Nested Menu/Select/Toolbar/Drawer integration | Those components do not exist yet |
| Detached-trigger SSR and hydration cases      | React-only                        |

### Alert dialog

| Base UI case                                                                                   | Why it does not apply                                                                                                  |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Detached-trigger reparenting while open (`keeps detached triggers clickable when reparented…`) | Pins React reparenting semantics via `setProps` wrapper swaps; Solid triggers keep their DOM node when wrappers change |
| `keeps detached triggers clickable during Fast Refresh-like handle recreation`                 | Fast Refresh is React-only                                                                                             |

### Tooltip

| Base UI case                                       | Why it is deferred                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| Nested-trigger choreography and safe-polygon paths | Nested hover ownership and pointer path retention are tracked by RUI-49 |

### Scroll Area

| Base UI case                                                                                 | Why it does not apply                                                                                                                                                    |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `does not re-render parts on scroll when the corner size is unchanged` (`context stability`) | Counts React commits. Solid has no re-render; the equivalent guarantee is the bail-out in the `setCornerSize` updater, which is structural rather than observable        |
| `adds [data-hovering] when the synthetic pointer target differs from the native path`        | Pins that Base UI reads React's synthetic `event.target` rather than `composedPath()[0]`. Solid binds `pointerenter` natively, so there is no retargeting to distinguish |

<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->
