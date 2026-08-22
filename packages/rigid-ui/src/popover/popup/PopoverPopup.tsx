import { createEffect, createSignal } from "solid-js";
import { usePopoverRootContext } from "../root/PopoverRootContext";
import { usePopoverPositionerContext } from "../positioner/PopoverPositionerContext";
import { renderElement } from "../../internals/renderElement";
import { REASONS } from "../../internals/reasons";
import { callEventHandler } from "../../utils/domProps";
import type {
  PopoverAlign,
  PopoverFocusTarget,
  PopoverInstantType,
  PopoverNativeProps,
  PopoverSide,
  PopoverTransitionStatus,
} from "../types";

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

export interface PopoverPopupState {
  open: boolean;
  side: PopoverSide;
  align: PopoverAlign;
  transitionStatus: PopoverTransitionStatus;
  instant: PopoverInstantType;
}

export interface PopoverPopupProps extends PopoverNativeProps<HTMLDivElement> {
  initialFocus?: PopoverFocusTarget;
  finalFocus?: PopoverFocusTarget;
}

function targetFromValue(
  value: PopoverFocusTarget | undefined,
  interactionType: "mouse" | "touch" | "pen" | "keyboard",
) {
  if (typeof value === "function") return value(interactionType);
  if (value && typeof value === "object" && "current" in value) return value.current;
  return value;
}

function focusableElements(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hidden && element.getAttribute("aria-hidden") !== "true",
  );
}

export function PopoverPopup(props: PopoverPopupProps) {
  const context = usePopoverRootContext();
  const positioner = usePopoverPositionerContext();
  const [element, setElement] = createSignal<HTMLDivElement>();
  const [size, setSize] = createSignal({ width: 0, height: 0 });

  let wasOpen = false;

  createEffect(
    () => element(),
    (popup) => {
      if (!popup || typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(([entry]) => {
        if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      });
      observer.observe(popup);
      return () => observer.disconnect();
    },
  );

  createEffect(
    () => ({
      isOpen: context!.open(),
      popup: element(),
      reason: context!.openReason(),
      method: context!.openMethod(),
      initialFocus: props.initialFocus,
      finalFocus: props.finalFocus,
      trigger: context!.activeTrigger()?.element(),
    }),
    (state) => {
      const popup = state.popup;
      if (!popup) return;
      if (state.isOpen && !wasOpen && state.reason !== REASONS.triggerHover) {
        queueMicrotask(() => {
          if (!popup.isConnected) return;
          const resolved = targetFromValue(state.initialFocus, state.method);
          if (typeof state.initialFocus === "function" && resolved === undefined) return;
          if (resolved === false) return;
          if (resolved instanceof HTMLElement) {
            resolved.focus();
            return;
          }
          const focusable = focusableElements(popup);
          if (state.method === "touch") popup.focus();
          else (focusable[0] ?? popup).focus();
        });
      }
      if (!state.isOpen && wasOpen && state.reason !== REASONS.triggerHover) {
        queueMicrotask(() => {
          const resolved = targetFromValue(state.finalFocus, state.method);
          if (typeof state.finalFocus === "function" && resolved === undefined) return;
          if (resolved === false) return;
          if (resolved instanceof HTMLElement) {
            resolved.focus();
            return;
          }
          if (state.reason !== REASONS.outsidePress && state.reason !== REASONS.focusOut) {
            state.trigger?.focus();
          }
        });
      }
      wasOpen = state.isOpen;
    },
  );

  // The user's handlers are chained ahead of these by renderElement; the internal handlers only
  // observe defaultPrevented.
  function handleKeyDown(event: KeyboardEvent) {
    if (
      event.defaultPrevented ||
      event.key !== "Tab" ||
      context!.modal() === false ||
      context!.closePartCount() === 0
    ) {
      return;
    }
    const popup = element();
    if (!popup) return;
    const focusable = focusableElements(popup);
    if (focusable.length === 0) {
      event.preventDefault();
      popup.focus();
      return;
    }
    const currentIndex = focusable.indexOf(document.activeElement as HTMLElement);
    const nextIndex = event.shiftKey
      ? currentIndex <= 0
        ? focusable.length - 1
        : currentIndex - 1
      : currentIndex === focusable.length - 1
        ? 0
        : currentIndex + 1;
    if (currentIndex === -1 || nextIndex === 0 || nextIndex === focusable.length - 1) {
      event.preventDefault();
      focusable[nextIndex]?.focus();
    }
  }

  function handleFocusOut(event: FocusEvent) {
    if (event.defaultPrevented) return;
    const nextTarget = event.relatedTarget instanceof Node ? event.relatedTarget : null;
    // Pointer presses are handled by the root's document-level pointerdown listener.
    // Browsers may temporarily report body as active when a non-focusable part is pressed,
    // so treating a missing relatedTarget as an outside focus move closes and then reopens
    // the popover when its trigger is clicked.
    if (nextTarget === null) return;
    queueMicrotask(() => {
      if (!context!.open() || context!.containsTarget(nextTarget)) return;
      context!.requestOpen(false, REASONS.focusOut, event);
    });
  }

  // Transition/animation events bubble, so the consumer's handler must stay gated on the popup
  // itself — it cannot go through the automatic user-first chaining, which would fire it for
  // events coming from children too. `exclude` keeps the raw handlers out of the merge; these
  // wrappers re-invoke them under the original guard.
  function handleTransitionEnd(event: TransitionEvent) {
    if (event.target === event.currentTarget) callEventHandler(props.onTransitionEnd, event);
  }

  function handleAnimationEnd(event: AnimationEvent) {
    if (event.target === event.currentTarget) callEventHandler(props.onAnimationEnd, event);
  }

  return (
    <div
      {...renderElement<HTMLDivElement>(props as unknown as Record<string, unknown>, {
        props: {
          get id() {
            return props.id ?? context!.popupId;
          },
          get role() {
            return props.role ?? "dialog";
          },
          get tabindex() {
            return props.tabindex ?? -1;
          },
          get "aria-labelledby"() {
            return context!.titleId();
          },
          get "aria-describedby"() {
            return context!.descriptionId();
          },
          get "data-open"() {
            return context!.open() ? "" : undefined;
          },
          get "data-closed"() {
            return !context!.open() ? "" : undefined;
          },
          get "data-starting-style"() {
            return context!.transitionStatus() === "starting" ? "" : undefined;
          },
          get "data-ending-style"() {
            return context!.transitionStatus() === "ending" ? "" : undefined;
          },
          get "data-side"() {
            return positioner!.side();
          },
          get "data-align"() {
            return positioner!.align();
          },
          get "data-instant"() {
            return context!.instantType();
          },
          // Merged with the consumer's style by the internal mergeProps: internal values first,
          // user overrides per property.
          get style() {
            return {
              "--popup-width": `${size().width}px`,
              "--popup-height": `${size().height}px`,
            };
          },
          onKeyDown: handleKeyDown,
          onFocusOut: handleFocusOut,
          onTransitionEnd: handleTransitionEnd,
          onAnimationEnd: handleAnimationEnd,
        },
        ref: [setElement, (node: HTMLDivElement) => context!.setPopupElement(node)],
        exclude: ["initialFocus", "finalFocus", "onTransitionEnd", "onAnimationEnd"],
      })}
    >
      {props.children}
    </div>
  );
}

export namespace PopoverPopup {
  export type State = PopoverPopupState;
  export type Props = PopoverPopupProps;
}
