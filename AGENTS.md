We're building a component library for Solid. We're targeting the latest 2.x RC version of Solid. The target branch is `solid-2-rc`. `main` has the old Solid 1.x code. The components are similar in vein to Radix UI (older, but still more popular) and Base UI (more modern, actively maintained, we're targeting this API surface more). Prefer native browser features where they carry their weight, but not at the cost of the API: anchored popups use Floating UI (`@floating-ui/dom`, the vanilla build) through the `createAnchorPositioning` composable, because CSS anchor positioning cannot report the resolved placement back to JS. Our goal is building a de-facto standard unstyled component library for Solid 2. Our test coverage should be built on Base UI's - it has a great testing coverage we can learn from. See `reference/`. Known divergences from Base UI live in Linear, in the Rigid UI team (https://linear.app/rigid-ui-fdemb/team/RUI), one issue per gap and per fix, labeled by component. When you close a gap, port the Base UI test the issue names and close the issue.

The library lives in `packages/rigid-ui`. The demo lives in `apps/demo`, and consumes the library through its published `exports` map rather than a source alias, so the demo build doubles as a check that the packaged artifact is intact. That makes `packages/rigid-ui/dist` a prerequisite for type checking and for running the demo — build the library first.

## Base UI test migration checklist

- [ ] Locate every Base UI test file for the component under `reference/base-ui/packages/react/src/`.
- [ ] Inventory each behavioral contract and separate JSDOM-safe tests from tests requiring real browser layout.
- [ ] Port applicable behavior to Solid with `@solidjs/testing-library`; do not reproduce React-only renderer, ref, or lifecycle semantics.
- [ ] Reuse the shared test setup and fixtures instead of introducing component-specific render or cleanup utilities.
- [ ] Preserve Base UI's observable assertions for DOM attributes, CSS variables, events, scrolling, sizing, direction, and unmount safety.
- [ ] Run layout, overflow, ResizeObserver, and pointer-geometry coverage in Chromium rather than mocking browser measurements in JSDOM.
- [ ] Treat failing migrated tests as implementation gaps; fix the component instead of weakening or skipping the contract.
- [ ] Record intentionally inapplicable Base UI cases in the tables below, with the Solid or public-API difference that makes them inapplicable. Do not open a Linear issue for them.
- [ ] Run `pnpm ready` before considering the migration complete. It runs the library build, `vp check`, both test suites, and the demo build. The individual steps are also available as `pnpm build`, `pnpm test:run`, `pnpm test:chromium`, and `pnpm build:site`.

## Gap tracking

Open gaps, unported test clusters, and the record of past fixes are Linear issues in the Rigid UI
team, labeled `Popover`, `Dialog`, or `Scroll Area`. Search there before auditing a component
against `reference/base-ui/` again; the audit has already happened once and the findings are
written down.

Each open issue names the Base UI test that encodes the contract. Port that test, fix the
component, close the issue.

## Solid hazards when porting Base UI tests

Check these before concluding a ported test has found a bug.

- **A signal write is not visible to a read until the next flush.** `setFoo(x)` followed by a
  synchronous `foo()` still returns the old value. In tests, use a plain variable for anything a
  callback reads and the test mutates mid-run. In components, never read back a signal you just
  wrote in order to make a decision. Four separate defects came from this one hazard.
- **A `delay={0}` hover timer is a macrotask.** `await flushMicrotasks()` does not advance it, so
  a test asserting "hover did not open the popover" passes whether or not the guard works. Wait a
  real tick. See `settleHoverDelay` in `PopoverTrigger.test.tsx`.
- **Positioning is async**, so the positioner is `opacity: 0` until its first pass lands.
  Assertions on popup visibility must `await`. Base UI behaves the same way; their awaited
  `render` hides it.
- **Object-spreading a getter bag freezes it.** `{...bag}` copies getter _results_, so a bag from
  `renderElement`/`renderPart` loses its reactivity the moment it is spread into a plain object.
  Use `merge` from `solid-js` (or pass the bag itself) wherever a bag has to become another
  object. The same applies to destructuring a rest object out of one.
- **Solid's `omit` freezes the key set unless the source is a Solid proxy.** Given a plain object
  or a hand-rolled proxy it copies the descriptors it can see _once_, so a key that appears later
  (a state attribute switching on) never shows up. Use `omitProps` from `internals/mergeProps`
  when the source is one of our bags.
- **`in` on a merged props proxy is an untracked read.** `"class" in props` resolves the
  function-backed sources of a Solid `merge` proxy, which both warns (`STRICT_READ_UNTRACKED`)
  and makes the decision once. Never branch on the presence of a prop in a component body;
  define the getter unconditionally and let it resolve to `undefined`.
- **A component's `render` prop must be read once, untracked.** Every read of a JSX element in a
  prop position rebuilds it, and a component render prop is re-invoked per read. `children()`
  does not help — outside a tracking scope it recomputes on each read.
- **Destructuring the payload render prop** (`{({ payload }) => …}`) freezes the value, because
  the render prop receives a real props object. Ordinary "don't destructure props", and
  `solid/no-destructure`-style lints catch it. Write `{(state) => … state.payload}`.
- **JSDOM's `scrollTop`/`scrollLeft` setters are no-ops** on elements it deems unscrollable, so
  Base UI's `fireEvent.scroll(el, { target: { scrollTop: 1 } })` silently does nothing. Use
  `scrollViewport` from `test/ScrollAreaFixture.tsx`, which redefines the property and dispatches
  the event by hand.
- **Unmounting from an event handler is async.** Base UI's unmount-safety tests use
  `ReactDOM.flushSync`; the Solid ports set a signal and `await flushMicrotasks()` before
  asserting the part is gone. The contract still holds, that an in-flight gesture does not throw
  against a torn-down tree, and each port also fires a follow-up event at the detached node.

## Intentionally inapplicable Base UI cases

### Shared

| Base UI case                                    | Why it does not apply                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `describeConformance`, `nativeButton`           | React renderer concepts; Solid composition differs. Replaced with an explicit props/class/style/ref forwarding test per part                                                                                                                                                                                                                                                                                 |
| `render` given a JSX element (`render={<a />}`) | Solid evaluates a JSX element in a prop position eagerly, through a getter that rebuilds it on every read, and the consumer's own reactive bindings own the resulting attributes — a later flush overwrites anything we merge in. Under SSR it compiles to an opaque HTML string with nothing to merge into. The tag, component, and callback forms of `render` are supported; see `internals/renderPart.ts` |
| React ref and lifecycle semantics               | N/A                                                                                                                                                                                                                                                                                                                                                                                                          |
| `expect(...).toThrow()` on render-time errors   | An uncaught throw halts Solid's reactive system for the rest of the module. Capture with an `<Errored>` boundary instead, see `PopoverPositioner.test.tsx`                                                                                                                                                                                                                                                   |

### Popover

| Base UI case                                                                                | Why it does not apply             |
| ------------------------------------------------------------------------------------------- | --------------------------------- |
| Toolbar composite-key tests (`does not relay composite keys from the popup to the toolbar`) | No Toolbar component              |
| Nested Combobox/Menu/Tooltip integration                                                    | Those components do not exist yet |
| `remains anchored to the trigger when closing from a tooltip trigger close`                 | Requires Tooltip                  |

### Dialog

| Base UI case                                  | Why it does not apply             |
| --------------------------------------------- | --------------------------------- |
| Nested Menu/Select/Toolbar/Drawer integration | Those components do not exist yet |
| Detached-trigger SSR and hydration cases      | React-only                        |

### Alert dialog

| Base UI case                                                                                   | Why it does not apply                                                                                                  |
| ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `renders a viewport`                                                                           | `Dialog.Viewport` is not ported yet; port the test when RUI-46 closes                                                  |
| Detached-trigger reparenting while open (`keeps detached triggers clickable when reparented…`) | Pins React reparenting semantics via `setProps` wrapper swaps; Solid triggers keep their DOM node when wrappers change |
| `keeps detached triggers clickable during Fast Refresh-like handle recreation`                 | Fast Refresh is React-only                                                                                             |

### Tooltip

| Base UI case                                       | Why it is deferred                                                      |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| Cursor tracking with `trackCursorAxis`             | Cursor-relative positioning is tracked by RUI-48                        |
| Nested-trigger choreography and safe-polygon paths | Nested hover ownership and pointer path retention are tracked by RUI-49 |

### Scroll Area

| Base UI case                                                                                 | Why it does not apply                                                                                                                                                    |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `does not re-render parts on scroll when the corner size is unchanged` (`context stability`) | Counts React commits. Solid has no re-render; the equivalent guarantee is the bail-out in the `setCornerSize` updater, which is structural rather than observable        |
| `adds [data-hovering] when the synthetic pointer target differs from the native path`        | Pins that Base UI reads React's synthetic `event.target` rather than `composedPath()[0]`. Solid binds `pointerenter` natively, so there is no retargeting to distinguish |

## `render` prop scope

`render` accepts a tag name, a component, or a callback `(props, state) => JSX.Element`
(`internals/renderPart.ts`). One limit is deliberate:

- **A tag name does not widen the part's prop types.** `<Popover.Trigger render="a" href="…">`
  does not typecheck, because the props type still describes a `<button>`. Put the extra
  attributes on the element the callback returns. Base UI has the same limitation.

Every part that has state passes it to `renderPart` and threads its `State` type through its
props, so the callback's second argument is typed and live. Parts whose Base UI counterpart has
no state (`Title`, `Description`, `Portal`, `ScrollArea.Corner`) receive `{}`.

`nativeButton` is wired into `Popover.Trigger`, `Popover.Close`, `Dialog.Trigger`, and
`Dialog.Close` through `useButton` — the same four parts Base UI wires. It defaults to `true`;
set it to `false` when `render` produces something other than a `<button>`, and the part applies
`role="button"`, a tab index, and Enter/Space activation instead of assuming native semantics.
Leaving it `true` on a non-button logs a dev warning. `Tooltip.Trigger` does not use `useButton`,
matching Base UI: its `disabled` prop disables the tooltip, not the button.

## Deliberate implementation differences

Not gaps, so they have no Linear issue.

- `resolveInstantType` guards with `event instanceof MouseEvent` before reading `detail`, where
  Base UI casts unconditionally. Same outcome on every real path, and no `undefined === 0`
  accident.
- `ScrollArea.Scrollbar` reports only the axis it controls. Base UI's scrollbar state carries both
  axes, so a vertical track there also renders `data-has-overflow-x` and the horizontal edge
  attributes. Ours resolves the inactive axis to `false`, which renders nothing. This predates the
  `render` work; `enumSync.test.tsx` pins the current behaviour.
- `Tooltip.Trigger` renders `data-closed` and `data-trigger-disabled`, which Base UI's trigger
  does not. `data-trigger-disabled` is covered by `TooltipRoot.test.tsx`.

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
