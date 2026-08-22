import { createEffect, createMemo, createSignal, Show, untrack, type Accessor } from "solid-js";
import type { JSX } from "@solidjs/web";
import { contains } from "./contains";
import { getTarget } from "./getTarget";
import { markOthers } from "./markOthers";
import { enqueueFocus } from "./enqueueFocus";
import { FocusGuard } from "./FocusGuard";
import {
  activeElement,
  isElementVisible,
  isTabbable,
  ownerDocument,
  tabbable,
  type FocusableElement,
} from "./tabbable";

export type InteractionType = "mouse" | "touch" | "pen" | "keyboard";

/**
 * - `false`: do not move focus.
 * - `true`: default behavior.
 * - an element: move focus there.
 * - `{ current }`: move focus to the referenced element.
 * - function of the interaction type: return an element, `true`/`null` for the default
 *   behavior, or `false`/`undefined` to do nothing.
 */
export type PopupFocusTarget =
  | boolean
  | HTMLElement
  | { readonly current: HTMLElement | null }
  | ((interactionType: InteractionType) => void | boolean | HTMLElement | null);

export interface PopupFocusManagerOptions {
  /** The element focus is managed within. */
  popup: Accessor<HTMLElement | undefined>;
  /** The element that opened the popup, used as the default return-focus target. */
  trigger?: () => Element | null | undefined;
  open: Accessor<boolean>;
  disabled?: Accessor<boolean>;
  /** Traps focus inside the popup and hides everything outside from assistive tech. */
  modal?: boolean | Accessor<boolean>;
  closeOnFocusOut?: Accessor<boolean>;
  /**
   * Where focus lands when it is lost from inside the popup, e.g. its focused child being
   * removed. `true` restores to the nearest tabbable inside the popup, `"popup"` straight to
   * the popup element itself.
   */
  restoreFocus?: boolean | "popup";
  initialFocus?: PopupFocusTarget;
  finalFocus?: PopupFocusTarget;
  openMethod?: () => InteractionType;
  /** Extra elements treated as part of the popup subtree despite living elsewhere. */
  insideElements?: () => Array<Element | null | undefined>;
  /** Called when focus moving out of the popup should dismiss it (`closeOnFocusOut`). */
  onRequestClose?: (event: FocusEvent) => void;
}

const LIST_LIMIT = 20;
// ES2021's `WeakRef`, declared locally so the package target can stay ES2020.
interface WeakRefOf<T extends object> {
  deref(): T | undefined;
}
const WeakRefCtor: new <T extends object>(target: T) => WeakRefOf<T> =
  typeof globalThis !== "undefined" && "WeakRef" in globalThis
    ? // oxlint-disable-next-line no-explicit-any
      (globalThis as any).WeakRef
    : function () {
        throw new Error("Rigid UI: WeakRef is not supported in this environment.");
      };
let previouslyFocusedElements: WeakRefOf<Element>[] = [];

function clearDisconnectedPreviouslyFocusedElements() {
  previouslyFocusedElements = previouslyFocusedElements.filter(
    (entry) => entry.deref()?.isConnected,
  );
}

function addPreviouslyFocusedElement(element: Element | null | undefined) {
  clearDisconnectedPreviouslyFocusedElements();
  if (element && element.nodeName.toLowerCase() !== "body") {
    previouslyFocusedElements.push(new WeakRefCtor(element));
    if (previouslyFocusedElements.length > LIST_LIMIT) {
      previouslyFocusedElements = previouslyFocusedElements.slice(-LIST_LIMIT);
    }
  }
}

function getPreviouslyFocusedElement() {
  clearDisconnectedPreviouslyFocusedElements();
  return previouslyFocusedElements[previouslyFocusedElements.length - 1]?.deref();
}

function getFirstTabbableElement(container: Element | null) {
  if (!container) {
    return null;
  }

  if (isTabbable(container)) {
    return container;
  }

  return tabbable(container)[0] || container;
}

function stopEvent(event: Event) {
  event.preventDefault();
  event.stopPropagation();
}

function resolveTarget(
  value: PopupFocusTarget | undefined,
  interactionType: InteractionType,
): void | boolean | HTMLElement | null {
  if (typeof value === "function") return value(interactionType);
  if (value && typeof value === "object" && "current" in value) return value.current;
  return value;
}

/** Manages `tabindex` on a dialog-role container so it joins or leaves the tab order. */
function handleTabIndex(floatingFocusElement: HTMLElement) {
  if (
    floatingFocusElement.hasAttribute("tabindex") &&
    !floatingFocusElement.hasAttribute("data-tabindex")
  ) {
    return;
  }

  if (!floatingFocusElement.getAttribute("role")?.includes("dialog")) {
    return;
  }

  const focusableElements = tabbable(floatingFocusElement);
  const tabIndex = floatingFocusElement.getAttribute("tabindex");

  if (focusableElements.length === 0) {
    if (tabIndex !== "0") {
      floatingFocusElement.setAttribute("tabindex", "0");
      floatingFocusElement.setAttribute("data-tabindex", "0");
    }
  } else if (tabIndex !== "-1" || floatingFocusElement.getAttribute("data-tabindex") !== "-1") {
    floatingFocusElement.setAttribute("tabindex", "-1");
    floatingFocusElement.setAttribute("data-tabindex", "-1");
  }
}

export function createPopupFocusManager(options: PopupFocusManagerOptions) {
  const open = options.open;
  const disabled = options.disabled ?? (() => false);
  const modal = () =>
    (typeof options.modal === "function" ? options.modal() : options.modal) ?? true;
  const closeOnFocusOut = options.closeOnFocusOut ?? (() => true);
  const restoreFocusMode = () => options.restoreFocus ?? false;

  const [beforeGuard, setBeforeGuard] = createSignal<HTMLSpanElement>();
  const [afterGuard, setAfterGuard] = createSignal<HTMLSpanElement>();

  const lastFocusedTabbable: { current: FocusableElement | null } = { current: null };
  const preventReturnFocus: { current: boolean } = { current: false };
  const isPointerDown: { current: boolean } = { current: false };
  const pointerDownTimeout = { id: null as ReturnType<typeof setTimeout> | null };
  const lastInteractionType: { current: InteractionType | "" } = { current: "" };

  const getInsideElements = (): Element[] =>
    (options.insideElements?.() ?? []).filter((element): element is Element => element != null);

  const guardsVisible = createMemo(() => !disabled() && modal());

  createEffect(
    () => [options.popup(), disabled()] as const,
    ([floatingFocusElement, isDisabled]) => {
      if (isDisabled || !floatingFocusElement) return;
      handleTabIndex(floatingFocusElement);
      return () => {
        queueMicrotask(clearDisconnectedPreviouslyFocusedElements);
      };
    },
  );

  createEffect(
    () => [options.popup(), disabled(), modal()] as const,
    ([floatingFocusElement, isDisabled, isModal]) => {
      if (isDisabled || !isModal || !floatingFocusElement) return;
      const popupElement = floatingFocusElement;
      function onKeyDown(event: KeyboardEvent) {
        if (event.key !== "Tab") return;
        if (
          contains(popupElement, activeElement(ownerDocument(popupElement))) &&
          tabbable(popupElement).length === 0
        ) {
          stopEvent(event);
        }
      }
      const doc = ownerDocument(floatingFocusElement);
      doc.addEventListener("keydown", onKeyDown);
      return () => doc.removeEventListener("keydown", onKeyDown);
    },
  );

  createEffect(
    () => [open(), disabled(), options.popup()] as const,
    ([isOpen, isDisabled, floating]) => {
      if (!isOpen || isDisabled || !floating) return;
      const doc = ownerDocument(floating);

      function onPointerDown(event: PointerEvent) {
        const target = getTarget(event) as Element | null;
        const insideTargets = [options.trigger?.() ?? null, floating, ...getInsideElements()];
        const pointerTargetInside = insideTargets.some(
          (element) => element != null && (element === target || contains(element, target)),
        );
        isPointerDown.current = true;
        if (pointerDownTimeout.id !== null) clearTimeout(pointerDownTimeout.id);
        pointerDownTimeout.id = setTimeout(() => {
          pointerDownTimeout.id = null;
          isPointerDown.current = false;
        }, 0);
        lastInteractionType.current = (event.pointerType || "keyboard") as InteractionType;
        if (!pointerTargetInside) {
          // An outside press dismisses through the root; make sure a focus shift caused by it
          // does not also trigger a second, focus-out dismissal.
          preventReturnFocus.current = false;
        }
      }

      function onKeyDown() {
        lastInteractionType.current = "keyboard";
      }

      doc.addEventListener("pointerdown", onPointerDown, true);
      doc.addEventListener("keydown", onKeyDown, true);
      return () => {
        doc.removeEventListener("pointerdown", onPointerDown, true);
        doc.removeEventListener("keydown", onKeyDown, true);
        if (pointerDownTimeout.id !== null) clearTimeout(pointerDownTimeout.id);
      };
    },
  );

  createEffect(
    () => [options.popup(), disabled(), closeOnFocusOut(), options.trigger?.() ?? null] as const,
    ([floating, isDisabled, shouldCloseOnFocusOut, trigger]) => {
      if (isDisabled || !shouldCloseOnFocusOut) return;
      if (!floating && !trigger) return;

      function handleFocusIn(event: FocusEvent) {
        const target = getTarget(event) as FocusableElement | null;
        if (isTabbable(target)) {
          lastFocusedTabbable.current = target;
        }
      }

      function handleFocusOutside(event: FocusEvent) {
        const relatedTarget = event.relatedTarget as HTMLElement | null;
        const target = getTarget(event) as HTMLElement | null;
        const floatingFocusElement = options.popup();

        if (
          modal() &&
          relatedTarget == null &&
          target != null &&
          floatingFocusElement &&
          contains(floatingFocusElement, target)
        ) {
          addPreviouslyFocusedElement(target);
        }

        queueMicrotask(() => {
          if (!open() || disabled()) return;

          const insideCandidates = [
            options.trigger?.() ?? null,
            floatingFocusElement,
            ...getInsideElements(),
          ];
          const movedToUnrelatedNode = !insideCandidates.some(
            (element) =>
              element != null &&
              (element === relatedTarget ||
                contains(element, relatedTarget) ||
                contains(relatedTarget, element)),
          );
          const isRelatedFocusGuard =
            relatedTarget != null &&
            relatedTarget.hasAttribute("data-rigid-ui-focus-guard") &&
            [beforeGuard(), afterGuard()].includes(relatedTarget);

          if (
            restoreFocusMode() &&
            floatingFocusElement &&
            target != null &&
            !isElementVisible(target) &&
            activeElement(ownerDocument(floatingFocusElement)) ===
              ownerDocument(floatingFocusElement).body
          ) {
            if (restoreFocusMode() === "popup") {
              floatingFocusElement.focus();
              requestAnimationFrame(() => {
                if (open()) floatingFocusElement.focus();
              });
              return;
            }

            const tabbableContent = tabbable(floatingFocusElement);
            const nodeToFocus =
              (lastFocusedTabbable.current && tabbableContent.includes(lastFocusedTabbable.current)
                ? lastFocusedTabbable.current
                : null) ||
              tabbableContent[tabbableContent.length - 1] ||
              floatingFocusElement;
            nodeToFocus.focus();
            return;
          }

          if (
            !modal() &&
            relatedTarget &&
            movedToUnrelatedNode &&
            !isRelatedFocusGuard &&
            !isPointerDown.current &&
            relatedTarget !== getPreviouslyFocusedElement()
          ) {
            preventReturnFocus.current = true;
            options.onRequestClose?.(event);
          }
        });
      }

      const triggerElement = trigger;

      if (triggerElement instanceof HTMLElement) {
        triggerElement.addEventListener("focusout", handleFocusOutside);
      }
      if (floating) {
        floating.addEventListener("focusin", handleFocusIn);
        floating.addEventListener("focusout", handleFocusOutside);
      }

      return () => {
        if (triggerElement instanceof HTMLElement) {
          triggerElement.removeEventListener("focusout", handleFocusOutside);
        }
        if (floating) {
          floating.removeEventListener("focusin", handleFocusIn);
          floating.removeEventListener("focusout", handleFocusOutside);
        }
      };
    },
  );

  createEffect(
    () => [open(), disabled(), options.popup(), modal(), getInsideElements()] as const,
    ([isOpen, isDisabled, floating, isModal, inside]) => {
      if (!isOpen || isDisabled || !floating) return;
      return markOthers([floating, ...inside], {
        ariaHidden: isModal,
        mark: false,
      });
    },
  );

  createEffect(
    () => [open(), disabled(), options.popup()] as const,
    ([isOpen, isDisabled, floatingFocusElement]) => {
      if (!isOpen || isDisabled || !floatingFocusElement) return;

      const doc = ownerDocument(floatingFocusElement);
      const previouslyFocusedElement = activeElement(doc);
      lastInteractionType.current = "";
      addPreviouslyFocusedElement(previouslyFocusedElement);

      queueMicrotask(() => {
        if (!open() || disabled() || !floatingFocusElement.isConnected) return;

        const method: InteractionType = options.openMethod?.() ?? "keyboard";
        const resolvedInitialFocus = resolveTarget(options.initialFocus, method);

        if (resolvedInitialFocus === undefined || resolvedInitialFocus === false) {
          return;
        }

        if (contains(floatingFocusElement, activeElement(doc))) {
          return;
        }

        const getDefaultFocusElement = () =>
          tabbable(floatingFocusElement)[0] || floatingFocusElement;

        let elToFocus: FocusableElement | null | undefined;
        if (resolvedInitialFocus === true || resolvedInitialFocus === null) {
          elToFocus = getDefaultFocusElement();
        } else {
          elToFocus = resolvedInitialFocus;
        }
        elToFocus = elToFocus || getDefaultFocusElement();

        const hadFocusInside = contains(floatingFocusElement, activeElement(doc));

        enqueueFocus(elToFocus, {
          preventScroll: elToFocus === floatingFocusElement,
          shouldFocus() {
            if (!open()) return false;
            if (hadFocusInside) return true;
            const currentActiveElement = activeElement(doc);
            const focusMovedInside =
              currentActiveElement !== elToFocus &&
              contains(floatingFocusElement, currentActiveElement);
            return !focusMovedInside;
          },
        });
      });
    },
  );

  createEffect(
    () => [open(), disabled(), options.popup(), options.openMethod?.() ?? null] as const,
    ([isOpen, isDisabled, floatingFocusElement, methodAtOpen]) => {
      if (!isOpen || isDisabled || !floatingFocusElement) return;

      const doc = ownerDocument(floatingFocusElement);
      const elementFocusedBeforeOpen = activeElement(doc);
      const preferPreviousFocus = methodAtOpen == null;

      addPreviouslyFocusedElement(elementFocusedBeforeOpen);

      // The disposer runs in the effect phase and is one-shot: it resolves where focus goes
      // back to *at close time*, then consumes that answer in the same tick. `options.trigger`
      // and `options.finalFocus` are reactive, and `trigger.isConnected` in particular has to
      // be evaluated now rather than at open time, because the trigger may have unmounted
      // while the popup was open. Nothing here wants to re-run on a later change, so the reads
      // are untracked deliberately instead of tripping STRICT_READ_UNTRACKED.
      return () =>
        untrack(() => {
          const activeEl = activeElement(doc);
          const insideElements = [floatingFocusElement, ...getInsideElements()];
          const isFocusInsideFloatingTree = insideElements.some(
            (element) => element === activeEl || contains(element, activeEl),
          );

          const method: InteractionType = lastInteractionType.current || "keyboard";
          const resolvedFinalFocus = resolveTarget(options.finalFocus, method);
          const hasExplicitReturnFocus = typeof options.finalFocus !== "boolean";

          let returnElement: Element | null = null;
          if (resolvedFinalFocus !== undefined && resolvedFinalFocus !== false) {
            if (resolvedFinalFocus === true || resolvedFinalFocus === null) {
              const trigger = options.trigger?.();
              const referenceReturnElement = trigger?.isConnected ? trigger : null;
              const previousReturnElement =
                elementFocusedBeforeOpen?.isConnected &&
                elementFocusedBeforeOpen.nodeName.toLowerCase() !== "body"
                  ? elementFocusedBeforeOpen
                  : null;
              returnElement = preferPreviousFocus
                ? previousReturnElement || referenceReturnElement
                : referenceReturnElement || previousReturnElement;
              if (!returnElement) {
                returnElement = getPreviouslyFocusedElement() || null;
              }
            } else {
              returnElement = resolvedFinalFocus;
            }
          }

          queueMicrotask(() => {
            const tabbableReturnElement = getFirstTabbableElement(returnElement);

            if (
              returnElement &&
              resolvedFinalFocus !== undefined &&
              resolvedFinalFocus !== false &&
              !preventReturnFocus.current &&
              tabbableReturnElement instanceof HTMLElement &&
              (!hasExplicitReturnFocus &&
              tabbableReturnElement !== activeEl &&
              activeEl !== doc.body
                ? isFocusInsideFloatingTree
                : true)
            ) {
              tabbableReturnElement.focus({ preventScroll: true });
            }

            preventReturnFocus.current = false;
          });
        });
    },
  );

  function handleBeforeGuardFocus() {
    if (!modal()) return;
    const floatingFocusElement = options.popup();
    if (!floatingFocusElement) return;
    const content = tabbable(floatingFocusElement);
    enqueueFocus(content[content.length - 1]);
  }

  function handleAfterGuardFocus() {
    if (!modal()) return;
    const floatingFocusElement = options.popup();
    if (!floatingFocusElement) return;
    enqueueFocus(tabbable(floatingFocusElement)[0]);
  }

  const guardVisible = guardsVisible;

  const renderBeforeGuard = (): JSX.Element => (
    <Show when={guardVisible()}>
      <FocusGuard data-type="inside" ref={setBeforeGuard} onFocus={handleBeforeGuardFocus} />
    </Show>
  );

  const renderAfterGuard = (): JSX.Element => (
    <Show when={guardVisible()}>
      <FocusGuard data-type="inside" ref={setAfterGuard} onFocus={handleAfterGuardFocus} />
    </Show>
  );

  return {
    renderBeforeGuard,
    renderAfterGuard,
  };
}
