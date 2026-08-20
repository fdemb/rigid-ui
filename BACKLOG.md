# Backlog — divergences from Base UI

Rigid UI targets Base UI's API surface. This file records where we currently fall short, so the
gaps are explicit rather than discovered by a consumer.

Gaps were found two ways: by auditing the implementation against
`reference/base-ui/packages/react/src/`, and by diffing test names — Base UI's tests encode
behavioral contracts, so a test of theirs we cannot write is usually a contract we do not honor.

**Popover coverage: 105 tests across 6 files, against Base UI's 177 across 13.**

Each item cites the Base UI test that names the contract. When closing a gap, port that test and
delete the entry.

Sections:

- [Not implemented](#not-implemented) — behavior we do not have
- [Fixed](#fixed) — defects found by ported tests and by using the demo
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

---

## Fixed

Six defects found and fixed, kept as a record of what each method of looking actually caught.

Four came from porting Base UI's tests for previously-untested features (1–4). **Two came from
clicking through the demo by hand (5–6), and neither was visible to a scripted driver** — both
only manifest at human timing: a press held long enough to separate `pointerdown` from `click`,
and a transition long enough to see. Worth remembering when deciding how much a green suite
proves.

1. **Infinite loop when triggers live inside the payload render-prop.** `PopoverRoot` treated the
   render prop as a reactive computation: it read `payload()` eagerly while building the subtree,
   so every payload change rebuilt that subtree — and rebuilding re-registered the triggers, which
   changed the payload again. Base UI's own multi-trigger test renders triggers inside the render
   prop, so this hung the suite with an OOM.

   Fixed by giving the render prop the semantics it should always have had — it is a component,
   so it is created with `createComponent` from `@solidjs/web` and receives a props object whose
   `payload` is a getter. It is invoked once; reactivity reaches the consumer through property
   access, exactly as with any other component's props. Pinned by
   `invokes the payload render prop once, regardless of payload changes`.

2. **`PopoverHandle.attach` could not detect a second root.** It read back the signal it had just
   written, which Solid does not flush until later, so two roots mounting in the same tick both
   saw `undefined` and neither warned. Attachment state now lives in a plain field.
3. **Imperative handle calls still reached a detached root**, for the same reason. `open`,
   `close`, and `isOpen` now go through the plain field.
4. **`openMethod` was never `touch`.** It was derived from the click event, but pointer type only
   exists on the preceding `pointerdown`. Triggers now pair the two and report the interaction
   type, which also fixes `initialFocus`/`finalFocus` receiving the wrong type. On top of that,
   hover is now disarmed while a popover is open from a touch press, so a stray mouse hover over a
   sibling trigger cannot steal it — Base UI's `keeps ownership on the tapped trigger when a
sibling trigger is hovered`.

5. **Pressing a sibling trigger closed the popover, then reopened it.** `containsTarget` only
   recognised the _active_ trigger, so the capture-phase `pointerdown` dismissal treated a press
   on any other trigger of the same root as an outside press. The popover closed on pointerdown
   and reopened on click. At machine speed the two land in the same frame and it looks like a
   clean switch; held for ~150ms it is a visible flicker, and it also restarted the enter
   animation instead of gliding. Every registered trigger now counts as inside. Pinned by
   `stays open through a press on a sibling trigger`, which asserts state _between_ pointerdown
   and click.

6. **The popup animated in from the top-left corner.** Until the first positioning pass lands the
   positioner sits at the origin with no transform; applying the real transform while a
   positional transition was live animated the popup across the viewport. Base UI suppresses this
   with `DISABLED_TRANSITIONS_STYLE` keyed to `transitionStatus === 'starting'`, but that races
   our async positioning — the mount status can clear before `computePosition` resolves. Ours is
   keyed to positioning directly and held one extra frame, so the transform is already in place
   and unchanged when transitions are enabled. Pinned by
   `does not animate in from the origin on the first positioning pass` (Chromium; it fails with
   `expected 0 to be greater than 300` without the fix).

### Known divergence: `finalFocus` interaction type

Base UI passes the interaction type that **closed** the popover; we pass the type that **opened**
it (`PopoverPopup.tsx:91` reads `openMethod`). Base UI's
`should support element-returning function and default via true + no-op via void for finalFocus
based on closeType` therefore cannot be ported as written. Deciding whether to track a close type
is open.

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

Solid-specific hazards that repeatedly bite when porting these tests — check these before
concluding a ported test has found a bug:

- **Signal writes are not visible to reads until the next flush.** `setFoo(x)` followed by a
  synchronous `foo()` still returns the old value. In tests, use a plain variable for anything a
  callback reads and the test mutates mid-run; in components, never read back a signal you just
  wrote to make a decision. This caused three of the four defects above.
- **A `delay={0}` hover timer is a macrotask.** `await flushMicrotasks()` does not advance it, so
  a test asserting "hover did not open the popover" passes whether or not the guard works. Wait a
  real tick — see `settleHoverDelay` in `PopoverTrigger.test.tsx`.
- **Positioning is async**, so the positioner is `opacity: 0` until its first pass lands.
  Assertions on popup visibility must `await`. Base UI behaves identically; it is invisible to
  them because their `render` is awaited.
- **Destructuring the payload render-prop** (`{({ payload }) => …}`) freezes the value, because
  the render prop receives a real props object. This is the ordinary "don't destructure props"
  rule, and `solid/no-destructure`-style lints catch it. Use `{(state) => … state.payload}`.

One deliberate implementation difference, not a gap: `resolveInstantType` guards with
`event instanceof MouseEvent` before reading `detail`, where Base UI casts unconditionally. Same
outcome on every real path, no `undefined === 0` accident.

---

## Not yet audited

**`scroll-area`.** Base UI has 3337 lines of tests across 5 files
(`root`, `scrollbar`, `thumb`, `viewport`, `enumSync`); we have 208 lines in one. The gap is
almost certainly larger than the popover's, but nobody has done the diff. Do that before treating
this file as a complete picture of where Rigid UI stands.
