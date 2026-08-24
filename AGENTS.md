We're building a component library for Solid. We're targeting the latest 2.x RC version of Solid. The components are similar in vein to Radix UI (older, but still more popular) and Base UI (more modern, actively maintained, we're targeting this API surface more). Prefer native browser features where they carry their weight, but not at the cost of the API: anchored popups use Floating UI (`@floating-ui/dom`, the vanilla build) through the `createAnchorPositioning` composable, because CSS anchor positioning cannot report the resolved placement back to JS. Our goal is building a de-facto standard unstyled component library for Solid 2. Our test coverage should be built on Base UI's - it has a great testing coverage we can learn from. See `reference/`. Known divergences from Base UI live in Linear, in the Rigid UI team (https://linear.app/rigid-ui-fdemb/team/RUI), one issue per gap and per fix, labeled by component. When you close a gap, port the Base UI test the issue names and close the issue.

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

| Base UI case                                         | Why it does not apply                                                                                                                                      |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `describeConformance`, `render` prop, `nativeButton` | React renderer concepts; Solid composition differs. Replaced with an explicit props/class/style/ref forwarding test per part                               |
| React ref and lifecycle semantics                    | N/A                                                                                                                                                        |
| `expect(...).toThrow()` on render-time errors        | An uncaught throw halts Solid's reactive system for the rest of the module. Capture with an `<Errored>` boundary instead, see `PopoverPositioner.test.tsx` |

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

### Scroll Area

| Base UI case                                                                                                | Why it does not apply                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `supports a custom scrollbar renderer that does not forward its ref`, `supports a custom content renderer…` | Exercises the `render` prop, which Solid composition does not have                                                                                                       |
| `does not re-render parts on scroll when the corner size is unchanged` (`context stability`)                | Counts React commits. Solid has no re-render; the equivalent guarantee is the bail-out in the `setCornerSize` updater, which is structural rather than observable        |
| `adds [data-hovering] when the synthetic pointer target differs from the native path`                       | Pins that Base UI reads React's synthetic `event.target` rather than `composedPath()[0]`. Solid binds `pointerenter` natively, so there is no retargeting to distinguish |

## Deliberate implementation differences

Not gaps, so they have no Linear issue.

- `resolveInstantType` guards with `event instanceof MouseEvent` before reading `detail`, where
  Base UI casts unconditionally. Same outcome on every real path, and no `undefined === 0`
  accident.

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
