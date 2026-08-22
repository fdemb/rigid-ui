# Backlog — divergences from Base UI

Rigid UI targets Base UI's API surface. This file records where we currently fall short, so the
gaps are explicit rather than discovered by a consumer.

Gaps were found two ways: by auditing the implementation against
`reference/base-ui/packages/react/src/`, and by diffing test names — Base UI's tests encode
behavioral contracts, so a test of theirs we cannot write is usually a contract we do not honor.

**Popover coverage: 105 tests across 6 files, against Base UI's 177 across 13.**
**Scroll Area coverage: 100 tests across 8 files, against Base UI's 8 files.**
**Dialog coverage: 40 tests across 2 files, against Base UI's ~90 across 8.**

Each item cites the Base UI test that names the contract. When closing a gap, port that test and
delete the entry.

Sections:

- [Popover](#popover)
  - [Not implemented](#not-implemented) — behavior we do not have
  - [Fixed](#fixed) — defects found by ported tests and by using the demo
  - [Missing infrastructure](#missing-infrastructure)
  - [Intentionally inapplicable](#intentionally-inapplicable)
- [Scroll Area](#scroll-area)
- [Dialog](#dialog)
- [Solid 2 dev-mode diagnostics](#solid-2-dev-mode-diagnostics)

---

# Dialog

`dialog/` was built on new shared infrastructure in `src/utils/`, ported from Base UI:

- `tabbable.ts`, `markOthers.ts`, `enqueueFocus.ts`, `FocusGuard.tsx` — direct ports.
- `createPopupFocusManager.tsx` — Solid port of the essential `FloatingFocusManager`
  semantics: inside/outside focus guards, initial and return focus (`initialFocus`/`finalFocus`
  in boolean/ref/function forms), `restoreFocus="popup"`, modal `aria-hidden` of outside
  content, `tabindex` management, interaction-type tracking.
- `createScrollLock.ts` — port of Base UI's `useScrollLock`: scrollbar-width compensation,
  the `scrollbar-gutter` fast path, and external-locker handoff. No layout shift on open.
- `InternalBackdrop.tsx` — fixed backdrop with optional trigger cutout.

This closes Popover backlog items **#4** (intentional outside press), **#5** (internal
backdrop), and **#6** (layout-shifting scroll lock) **for Dialog**; #1 (focus management) is
largely closed for Dialog via `createPopupFocusManager`. Those items stay listed under
Popover because they describe Popover, which still runs its own inline implementations;
migrating Popover onto this infrastructure is follow-up work, after which porting the named
contracts should be straightforward.

Known divergences from Base UI:

- Non-modal dialogs render no focus guards; Tab can escape to browser chrome instead of the
  element after the trigger. Modal dialogs trap correctly via inside guards.
- `finalFocus` receives the interaction type tracked during the open session (last pointer /
  keyboard input), not the type of the event that closed it — the same divergence recorded
  for Popover above.

Unported Base UI dialog test clusters, recorded so they are not re-audited blindly:

- Touch outside-press choreography (Chromium; multi-touch `changedTouches` sequences).
- Third-party scroll-lock handoff (react-remove-scroll / silk-hq / Ariakit simulators).
- Trusted CDP click suppression and pointer-lock scrub dismissal.
- Nested Menu/Select/Toolbar/Drawer integration — those components do not exist yet.
- Detached-trigger SSR/hydration cases — React-only.

---

# Popover

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

The popover has none; its attribute names are string literals inline in each component
(`data-side`, `data-instant`, `--available-width`, …). Nothing catches a typo or a rename, and
there is no single place to generate documentation from.

`scroll-area` now has the full set (`ScrollAreaRootDataAttributes.ts` and six more) plus
`scroll-area/enumSync.test.tsx`, so that is the shape to copy here. Worth doing before a docs
pass, and cheap relative to the items above.

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

# Scroll Area

Audited against `reference/base-ui/packages/react/src/scroll-area/` (8 test files, 3337 lines).
Ours is now 8 files mirroring theirs part-for-part: 100 tests, of which 3 are JSDOM-only and 44
are Chromium-only. The audit closed the coverage gap; what follows is what remains.

## Not implemented

### 1. No text direction context (RTL)

**Impact: the scroll area is wrong in RTL documents.** `direction` is a hardcoded `"ltr"` constant
in `src/scroll-area/viewport/ScrollAreaViewport.tsx` and
`src/scroll-area/scrollbar/ScrollAreaScrollbar.tsx`. Base UI resolves it from a
`DirectionProvider`, and RTL is not cosmetic here: `scrollLeft` runs from `0` down to
`-maxScrollLeft`, so every horizontal branch — overflow edges, wheel clamping, track click, thumb
offset, overscroll pinning — inverts.

The code paths are already written direction-agnostically (they branch on the constant), so this
is a matter of adding the provider and threading a reactive `direction` through, not of
rewriting the math.

Base UI contracts we cannot port until then:

- `root/ScrollAreaRoot.test.tsx` — `recomputes horizontal overflow edges when direction changes`, `correctly handles RTL`
- `scrollbar/ScrollAreaScrollbar.test.tsx` — `allows horizontal scrolling away from the RTL start edge`, `clamps horizontal RTL wheel scrolling at both edges`, `scrolls into the negative RTL range when clicking a horizontal RTL track`
- `thumb/ScrollAreaThumb.test.tsx` — `uses the negative RTL range and clears scrolling on pointer cancel`
- `viewport/ScrollAreaViewport.test.tsx` — `shrinks and pins the horizontal thumb to the inline start while overscrolling (RTL)`, `…to the inline end while overscrolling (RTL)`

The LTR halves of the parameterized cases above are ported; only the RTL arms are missing. Base
UI's `registers after the horizontal scrollbar becomes visible` is written RTL-only and is ported
here as its LTR equivalent.

### 2. No CSP context

Base UI's root reads `useCSPContext` for a `nonce` to stamp on the scrollbar-hiding `<style>`
element, and a `disableStyleElements` flag for apps that ship the rule themselves. Ours injects a
`<style>` into `document.head` unconditionally from a module-level singleton
(`src/utils/styles.ts`), so a strict `style-src` CSP silently drops it and the native scrollbars
stay visible on top of ours.

No Base UI test names this contract directly; it is an implementation gap found by the audit.

### 3. No `rootId` / `data-id` stamping

Base UI gives each root a generated id and stamps `data-id="{rootId}-viewport"` and
`data-id="{rootId}-scrollbar"` on the corresponding parts, so multiple scroll areas on a page are
distinguishable from the outside. We render neither. Cosmetic, no test depends on it.

## Fixed

Found by the ported tests and by diffing against Base UI's source. Everything here was broken
before this audit.

1. **Scrollbar wheel handling did not clamp, chain, or report.** `viewportEl.scrollTop += deltaY`
   with only an equality edge check: a large delta overshot past the end, a zero delta still
   called `preventDefault`, and nothing marked the area as scrolling. Now clamped through
   `Math.min`/`Math.max`, bailing before `preventDefault` at an edge so the wheel chains to the
   page, and calling `handleScroll`. Pinned by seven cases in
   `scrollbar/ScrollAreaScrollbar.test.tsx` including
   `preventDefaults only when it consumes the scroll, allowing chaining at edges`.
2. **A track press with a degenerate thumb teleported the scroll position.** No
   `maxThumbOffset <= 0` guard, so a track shorter than `MIN_THUMB_SIZE` divided by zero or by a
   negative and jumped to an extreme. Pinned by the four `non-positive thumb offset` cases.
3. **A track press quantized to the nearest scroll-snap point.** `disableViewportSnap` existed but
   was only called from the thumb-drag path, so a jump-to-click on a snapping viewport landed on a
   snap point and the thumb sat offset from the pointer for the whole drag. Pinned by
   `does not snap the initial jump-to-click position`.
4. **A press on the track moved focus.** No `mousedown` `preventDefault`; native scrollbars never
   move focus, for any button. Pinned by the four `track mouse down` cases.
5. **A cancelled gesture on the track left the drag latched.** The track had no `pointercancel`
   handler, and neither did the thumb. Pinned by `clears track drag state on pointer cancel` and
   `restores viewport scroll snap on pointer cancel`.
6. **Thumb presses were detected by `event.currentTarget !== event.target`**, which misses a thumb
   whose press is retargeted across a shadow boundary — the track then ran its jump-to-click on
   top of the drag. Now `contains(thumb, getTarget(event))`. Pinned by
   `ignores thumb presses reported through the composed path`.
7. **The thumb had no `data-scrolling` attribute at all**, so the documented per-axis scrolling
   state was unstyleable from the thumb. Pinned by the thumb's `data-scrolling` cases.
8. **Track and thumb painted at an unmeasured size on mount.** Neither honored
   `hasMeasuredScrollbar` (which the working tree had already added to the context but never
   consumed), so a `keepMounted` scrollbar flashed a full-height thumb for a frame. Pinned by
   `shows keepMounted scrollbar track and thumb after mount compute`.
9. **Scrollbars carried no overflow attributes.** `data-has-overflow-*` and `data-overflow-*` were
   on the root, viewport, and content but not the scrollbars, where Base UI exposes the axis each
   track controls. Pinned by `applies data attributes on vertical and horizontal scrollbars`.
10. **`ScrollArea.Content`'s ResizeObserver double-computed on mount**, and content that mounted
    _after_ the viewport's first measurement never brought the overflow state in sync at all,
    because there was no skip-first logic either way. Pinned by
    `measures content mounted after the viewport initial measurement`.
11. **No overscroll feedback.** The thumb offset was a plain clamped ratio, so Safari's rubber-band
    range (where `scrollTop` goes out of bounds) left the thumb pinned at full size. Ported Base
    UI's `applyOverscrollThumb`, which shrinks the thumb against the pinned edge damped by
    `content / (content + overscroll)`. Pinned by five `overscroll feedback` cases.
12. **`touchModality` was a signal, so it was always one tick stale.** The viewport's `onScroll`
    reads it in the same tick the root's `onPointerDown` writes it, and a Solid signal write is
    not visible to a synchronous read — so the WebKit momentum-scroll path this flag exists for
    never triggered. Now a plain field behind a context getter. Found by
    `restores programmatic scroll suppression after modality flips back to mouse`, and it is the
    fourth instance of the "signal writes are not visible until flush" hazard listed above.

## Intentionally inapplicable

| Base UI case                                                                                                | Why it does not apply                                                                                                                                                      |
| ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `describeConformance` in all five part test files                                                           | React renderer concept. Replaced with an explicit props/class/style/ref forwarding test per part                                                                           |
| `supports a custom scrollbar renderer that does not forward its ref`, `supports a custom content renderer…` | Exercises the `render` prop, which Solid composition does not have                                                                                                         |
| `does not re-render parts on scroll when the corner size is unchanged` (`context stability`)                | Counts React commits. Solid has no re-render; the equivalent guarantee is the bail-out in the `setCornerSize` updater, which is structural rather than observable          |
| `adds [data-hovering] when the synthetic pointer target differs from the native path`                       | Pins that Base UI reads React's _synthetic_ `event.target` rather than `composedPath()[0]`. Solid binds `pointerenter` natively, so there is no retargeting to distinguish |
| `expect(...).toThrow()` on the three missing-context errors                                                 | Same `<Errored>` boundary workaround as the popover; the contracts themselves are ported                                                                                   |

Additional Solid-specific notes for this component, beyond the shared hazards listed above:

- **JSDOM's `scrollTop`/`scrollLeft` setters are no-ops** on elements it deems unscrollable, so
  Base UI's `fireEvent.scroll(el, { target: { scrollTop: 1 } })` silently does nothing. Use
  `scrollViewport` from `test/ScrollAreaFixture.tsx`, which redefines the property and dispatches
  the event by hand.
- **Unmounting from an event handler is asynchronous.** Base UI's unmount-safety tests use
  `ReactDOM.flushSync`; the Solid ports set a signal and `await flushMicrotasks()` before
  asserting the part is gone. The contract being pinned — that the in-flight gesture does not
  throw against a torn-down tree — is preserved, and each port additionally fires a follow-up
  event at the detached node.

---

# Solid 2 dev-mode diagnostics

Running any popup or scroll-area part under the Solid 2 RC dev runtime emits
`[STRICT_READ_UNTRACKED]` — "Reactive value read directly in an effect callback will not
update". The reads are ours, not the demo's: effects across the library schedule work with
`queueMicrotask(...)` and then touch reactive values inside those closures, where nothing is
tracking. The behavior is correct today (the closures read the values they need at run time);
the diagnostic exists because a re-read scheduled this way can silently miss updates.

Sites (all `queueMicrotask` callbacks reading state/signals after the effect body finished):

- `src/popover/popup/PopoverPopup.tsx` — initial/return-focus effect reads `state.reason`,
  `state.initialFocus`, `state.finalFocus`, `state.trigger`, `state.method` inside its
  microtasks.
- `src/utils/createPopupFocusManager.tsx` — focus guard and focus-out handling re-reads
  manager state inside microtasks.
- `src/dialog/root/DialogRoot.tsx`, `src/popover/root/PopoverRoot.tsx` — transition finishers.
- `src/scroll-area/viewport/ScrollAreaViewport.tsx` — deferred thumb position computation.

Fix direction: capture plain snapshots of everything a closure needs before scheduling it,
or move the read into a tracked scope (`createEffect(on(...))`, a memo, or the effect's own
deps function). Then port whichever Base UI tests cover the affected focus choreography and
assert under a dev-mode run that the diagnostic stays silent.
