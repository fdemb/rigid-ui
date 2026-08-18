# Backlog — divergences from Base UI

Rigid UI targets Base UI's API surface. This file records where we currently fall short, so the
gaps are explicit rather than discovered by a consumer.

Gaps were found two ways: by auditing the implementation against
`reference/base-ui/packages/react/src/`, and by diffing test names — Base UI's tests encode
behavioral contracts, so a test of theirs we cannot write is usually a contract we do not honor.

**Popover coverage: 56 tests across 2 files, against Base UI's 177 across 13.**

Each item cites the Base UI test that names the contract. When closing a gap, port that test and
delete the entry.

Sections:

- [Not implemented](#not-implemented) — behavior we do not have
- [Implemented but untested](#implemented-but-untested) — the feature exists, the contract is unverified
- [Missing infrastructure](#missing-infrastructure)
- [Intentionally inapplicable](#intentionally-inapplicable) — recorded so they are not re-audited
- [Not yet audited](#not-yet-audited)

Anchor positioning is **not** listed: every public parameter of Base UI's
`UseAnchorPositioningSharedParameters` is implemented in `src/utils/createAnchorPositioning.ts`.

---

## Not implemented

### 1. Focus guards and focus-order management

**Impact: accessibility.** Ours is a `FOCUSABLE_SELECTOR` query plus a manual Tab wrap
(`src/popover/popup/PopoverPopup.tsx:132`). Base UI delegates to `FloatingFocusManager`
(1005 lines), which renders sentinel guard nodes so Tab moves to the element _after the trigger_
in DOM order rather than escaping to browser chrome.

Also missing from our selector: `[contenteditable]`, `iframe`, `audio[controls]`,
`video[controls]`, `details > summary`; no tabbable-vs-focusable distinction; no visibility
filtering beyond `hidden`/`aria-hidden`.

Base UI contracts we cannot satisfy — `root/PopoverRoot.test.tsx`:

- `should only render focus guards inside the popup when 'true'`
- `should keep trigger focus guards when 'true' without a close part`
- `moves focus to the element following the trigger, excluding the popup, when tabbing forward from the open popup` (three DOM-order variants: popup after trigger, focusables between, popup before trigger)
- `restores temporarily disabled focus before focusing a reopened keepMounted popover`
- `moves focus to the popup when a focused child is removed on pointerdown and outside press still dismisses`

And `popup/PopoverPopup.test.tsx`:

- `focuses the popup when the active element becomes display:none`

### 2. Patient/impatient click (`stickIfOpen`)

**Impact: hover-opened popovers dismiss on an accidental trigger click.** Base UI keeps a
hover-opened popover open if the trigger is clicked within `PATIENT_CLICK_THRESHOLD` (500ms) of
opening (`popover/store/PopoverStore.ts:150`). We have no equivalent — see `OPEN_DELAY` in
`src/popover/utils/constants.ts`, which only covers the hover-open delay.

`trigger/PopoverTrigger.test.tsx`:

- `does not close the popover if the user clicks too quickly`
- `closes the popover if the user clicks patiently`
- `sticks if the user clicks impatiently` / `does not stick if the user clicks patiently`
- `sticks when clicked before the hover delay completes`
- `should keep the popover open when re-hovered and clicked within the patient threshold`

`root/PopoverRoot.test.tsx`:

- `enables modal behavior after a hover-open is clicked`
- `reopens on hover after an impatient click is followed by a close button press`

### 3. Safe polygon for hover

**Impact: hover popovers close when the pointer travels diagonally toward them.** Base UI's
`useHover` tracks a safe polygon between trigger and popup. Ours is plain
`pointerenter`/`pointerleave` with delays (`src/popover/trigger/PopoverTrigger.tsx:82`).

- `root/PopoverRoot.test.tsx` — `cleans up the safe polygon handler after a hover-opened popup becomes click-sticky`

### 4. Outside press fires on pointerdown, not click

**Impact: dragging a selection out of the popup dismisses it; so does clicking the page
scrollbar.** We dismiss from a capture-phase `pointerdown` listener that closes immediately, with
no down/up pairing (`src/popover/root/PopoverRoot.tsx:411-430`). Base UI's `useDismiss`
(802 lines) requires an _intentional_ press — down and up on the same outside target.

`root/PopoverRoot.test.tsx`:

- `uses intentional outside press with user backdrop (mouse): closes on click, not on mousedown`
- `uses intentional outside press with internal backdrop (modal=true): closes on click, not on mousedown`
- `closes as soon as focus leaves the popup on pointer down outside`

### 5. Internal backdrop with trigger cutout

Base UI renders an internal backdrop for modal non-hover popovers, cut out around the trigger so
it stays interactive (`utils/InternalBackdrop.tsx`). We instead mark `document.body` children
inert/aria-hidden (`src/popover/root/PopoverRoot.tsx:57`).

`root/PopoverRoot.test.tsx`:

- `should render an internal backdrop when 'true'` / `should not render an internal backdrop when 'false'`

### 6. Scroll lock is unconditional and shifts layout

`src/popover/root/PopoverRoot.tsx:72` sets `document.body.style.overflow = "hidden"`. Base UI's
`useAnchoredPopupScrollLock` compensates for scrollbar width — **we cause a visible layout shift
on every modal open** — and only engages on touch when the popup actually covers the viewport.

`root/PopoverRoot.test.tsx`:

- `applies scroll lock when a touch-opened popup covers the viewport width`
- `does not apply scroll lock when a touch-opened popup is narrower than the viewport`

### 7. No nested-popover tree

Base UI wraps roots in `FloatingTree`/`FloatingNode` so nesting has defined dismissal order and
event propagation. We have `registerDescendantPortal`/`registerPortalWithAncestors`, which covers
containment but not ordering.

`root/PopoverRoot.test.tsx`:

- `returns focus through nested programmatic popovers in close order`
- `keeps the parent popover open when press starts in nested popover and ends outside`
- `should close child popover when clicking parent popover`
- `keeps the popover open when a nested menu opens via Enter/pointer using a shared container`

We cover only `keeps a parent open while interacting with a nested portaled popover`.

### 8. Not shadow-DOM safe

Base UI requires `ownerDocument`/`ownerWindow` and their `contains`/`getTarget`/`activeElement`
helpers (see `reference/base-ui/AGENTS.md`). We read globals at
`src/popover/root/PopoverRoot.tsx:430` and `src/popover/popup/PopoverPopup.tsx:150`.
`src/utils/contains.ts` exists but is used only by `scroll-area` — the popover does not use it at
all, relying on plain `Node.contains` in `containsTarget`.

`root/PopoverRoot.test.tsx`:

- `closing via outside press: works when clicking another element inside the same shadow root`
- `closing via outside press: works when clicking outside the shadow root`

### 9. `Popover.Viewport` is a stub

`src/popover/viewport/PopoverViewport.tsx` renders a bare wrapper with no logic and is **not
exported** from `index.parts.ts` — the only Base UI popover part we do not ship. Theirs is backed
by `usePopupViewport` (394 lines) and `adaptiveOriginMiddleware` (73), and drives size transitions
between panels keyed to the active trigger.

Consequence for positioning: Base UI switches the positioner to `top`/`left` when a Viewport is
present, because transforms break size animations. We always use `transform`.

`viewport/PopoverViewport.test.tsx` (603 lines, 6 tests), plus
`positioner/PopoverPositioner.test.tsx` — `uses top/left positioning with Viewport`.

Its `PopoverViewportState.instant` field is declared but unwired; that resolves with this item,
not separately.

---

## Implemented but untested

The feature exists and appears to work; nothing pins the contract.

| Area                              | Ours                                       | Base UI tests                                                                                                                                                                                                                                  |
| --------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `actionsRef` (`unmount`, `close`) | `PopoverRoot.tsx:452`                      | 2, in `root/PopoverRoot.test.tsx`                                                                                                                                                                                                              |
| `preventUnmountOnClose()`         | `PopoverRoot.tsx:236`                      | 4, incl. `does not leak from a canceled close into a synchronous second close`                                                                                                                                                                 |
| `onOpenChangeComplete`            | implemented                                | 5; we have 1 (`clears starting style before completing the enter animation`)                                                                                                                                                                   |
| Multiple triggers per Root        | `activeTrigger` + `registerTrigger`        | ~10 in `root/PopoverRoot.detached-triggers.test.tsx`; we have 1                                                                                                                                                                                |
| Handle lifecycle                  | `store/PopoverHandle.ts`                   | `ignores imperative handle calls made before a root is attached` / `after the root is detached`; `warns when a handle stays attached to more than one mounted root`; `throws when called with an unregistered trigger id` (we throw, untested) |
| Trigger style hooks               | `data-popup-open`, `data-pressed`          | 4 in `trigger/PopoverTrigger.test.tsx`                                                                                                                                                                                                         |
| Touch trigger ownership           | early-returns on `pointerType === "touch"` | `keeps ownership on the tapped trigger when a sibling trigger is hovered`; `hands ownership to a hovered sibling trigger when opened by mouse`                                                                                                 |
| `initialFocus` / `finalFocus`     | `PopoverPopup.tsx:86`                      | ~14 in `popup/PopoverPopup.test.tsx`; we have 2                                                                                                                                                                                                |

Worth prioritising within this table: **multiple triggers**. The feature works, but these
contracts are unverified and easy to regress —

- `should reuse the popup and positioner DOM nodes when switching triggers`
- `synchronizes ARIA attributes in controlled mode`
- `keeps positioning correct when conditional triggers unmount and the tree remounts`
- `returns focus to the active trigger when opening programmatically from body focus`
- `returns focus to the previous element when the trigger unmounts while open`
- `should not have inline scale style after switching triggers`

---

## Missing infrastructure

### Data-attribute and CSS-variable enums

Base UI declares every public attribute and custom property in per-part enum files —
`PopoverPositionerDataAttributes.ts`, `PopoverPositionerCssVars.ts`, and seven more — and
`popover/enumSync.test.tsx` (311 lines) asserts that what the components actually render matches
those enums. That is what keeps their generated docs honest.

We have none; our attribute names are string literals inline in each component
(`data-side`, `data-instant`, `--available-width`, …). Nothing catches a typo or a rename, and
there is no single place to generate documentation from.

This is worth doing before a docs pass, and it is cheap relative to the items above.

---

## Intentionally inapplicable

Recorded per the AGENTS.md migration checklist so they are not re-audited.

| Base UI case                                                                                | Why it does not apply                                                                                                                                       |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `describeConformance`, `render` prop, `nativeButton`                                        | React renderer concepts; Solid composition differs                                                                                                          |
| React ref/lifecycle semantics                                                               | N/A                                                                                                                                                         |
| Toolbar composite-key tests (`does not relay composite keys from the popup to the toolbar`) | No Toolbar component                                                                                                                                        |
| Nested Combobox/Menu/Tooltip integration                                                    | Those components do not exist yet                                                                                                                           |
| `remains anchored to the trigger when closing from a tooltip trigger close`                 | Requires Tooltip                                                                                                                                            |
| `expect(...).toThrow()` on render-time errors                                               | An uncaught throw halts Solid's reactive system for the rest of the module. Capture with an `<Errored>` boundary instead — see `PopoverPositioner.test.tsx` |

Two behavioural notes that are deliberate, not gaps:

- Positioning is async, so the positioner is `opacity: 0` until its first pass lands. Assertions
  on popup visibility must `await`. Base UI behaves identically; it is invisible to them because
  their `render` is awaited.
- `resolveInstantType` guards with `event instanceof MouseEvent` before reading `detail`, where
  Base UI casts unconditionally. Same outcome on every real path, no `undefined === 0` accident.

---

## Not yet audited

**`scroll-area`.** Base UI has 3337 lines of tests across 5 files
(`root`, `scrollbar`, `thumb`, `viewport`, `enumSync`); we have 208 lines in one. The gap is
almost certainly larger than the popover's, but nobody has done the diff. Do that before treating
this file as a complete picture of where Rigid UI stands.
