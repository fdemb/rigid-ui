We're building a component library for Solid. We're targeting the latest 2.x RC version of Solid. The components are similar in vein to Radix UI (older, but still more popular) and Base UI (more modern, actively maintained, we're targeting this API surface more). Prefer native browser features where they carry their weight, but not at the cost of the API: anchored popups use Floating UI (`@floating-ui/dom`, the vanilla build) through the `createAnchorPositioning` composable, because CSS anchor positioning cannot report the resolved placement back to JS. Our goal is building a de-facto standard unstyled component library for Solid 2. Our test coverage should be built on Base UI's - it has a great testing coverage we can learn from. See `reference/`.

## Base UI test migration checklist

- [ ] Locate every Base UI test file for the component under `reference/base-ui/packages/react/src/`.
- [ ] Inventory each behavioral contract and separate JSDOM-safe tests from tests requiring real browser layout.
- [ ] Port applicable behavior to Solid with `@solidjs/testing-library`; do not reproduce React-only renderer, ref, or lifecycle semantics.
- [ ] Reuse the shared test setup and fixtures instead of introducing component-specific render or cleanup utilities.
- [ ] Preserve Base UI's observable assertions for DOM attributes, CSS variables, events, scrolling, sizing, direction, and unmount safety.
- [ ] Run layout, overflow, ResizeObserver, and pointer-geometry coverage in Chromium rather than mocking browser measurements in JSDOM.
- [ ] Treat failing migrated tests as implementation gaps; fix the component instead of weakening or skipping the contract.
- [ ] Record intentionally inapplicable Base UI cases and the Solid or public-API difference that makes them inapplicable.
- [ ] Run `pnpm test:run`, `pnpm test:chromium`, and `pnpm build` before considering the migration complete.

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
