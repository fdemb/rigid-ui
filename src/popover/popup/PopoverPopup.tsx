import { createEffect, createSignal, omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { usePopoverRootContext } from "../root/PopoverRootContext";
import { usePopoverPositionerContext } from "../positioner/PopoverPositionerContext";
import {
  assignRef,
  callEventHandler,
  mergeStyles,
  type PopoverAlign,
  type PopoverFocusTarget,
  type PopoverNativeProps,
  type PopoverSide,
  type PopoverTransitionStatus,
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
  instant: "dismiss" | "click" | "focus" | "trigger-change" | undefined;
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
  const others = omit(
    props,
    "ref",
    "children",
    "initialFocus",
    "finalFocus",
    "style",
    "onKeyDown",
    "onFocusOut",
    "onTransitionEnd",
    "onAnimationEnd",
  );

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
      if (state.isOpen && !wasOpen && state.reason !== "trigger-hover") {
        queueMicrotask(() => {
          if (!popup.isConnected) return;
          const resolved = targetFromValue(state.initialFocus, state.method);
          if (resolved === false || (resolved === undefined && state.initialFocus === false))
            return;
          if (resolved instanceof HTMLElement) {
            resolved.focus();
            return;
          }
          const focusable = focusableElements(popup);
          if (state.method === "touch") popup.focus();
          else (focusable[0] ?? popup).focus();
        });
      }
      if (!state.isOpen && wasOpen && state.reason !== "trigger-hover") {
        queueMicrotask(() => {
          const resolved = targetFromValue(state.finalFocus, state.method);
          if (resolved === false || (resolved === undefined && state.finalFocus === false)) return;
          if (resolved instanceof HTMLElement) {
            resolved.focus();
            return;
          }
          if (state.reason !== "outside-press" && state.reason !== "focus-out") {
            state.trigger?.focus();
          }
        });
      }
      wasOpen = state.isOpen;
    },
  );

  function handleKeyDown(event: KeyboardEvent) {
    callEventHandler(props.onKeyDown, event);
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
    callEventHandler(props.onFocusOut, event);
    if (event.defaultPrevented) return;
    queueMicrotask(() => {
      if (!context!.open()) return;
      const active = document.activeElement;
      if (element()?.contains(active) || context!.activeTrigger()?.element()?.contains(active)) {
        return;
      }
      context!.requestOpen(false, "focus-out", event);
    });
  }

  function finishTransition(event: TransitionEvent | AnimationEvent) {
    if (event.target !== event.currentTarget) return;
    if (event instanceof TransitionEvent) callEventHandler(props.onTransitionEnd, event);
    else callEventHandler(props.onAnimationEnd, event);
    context!.finishTransition();
  }

  function popupStyle(): JSX.CSSProperties | string {
    return mergeStyles(
      {
        "--popup-width": `${size().width}px`,
        "--popup-height": `${size().height}px`,
      },
      props.style,
    );
  }

  return (
    <div
      {...others}
      ref={(node) => {
        setElement(node);
        context!.setPopupElement(node);
        assignRef(props.ref, node);
      }}
      id={props.id ?? context!.popupId}
      role={props.role ?? "dialog"}
      tabindex={props.tabindex ?? -1}
      aria-labelledby={context!.titleId()}
      aria-describedby={context!.descriptionId()}
      data-open={context!.open() ? "" : undefined}
      data-closed={!context!.open() ? "" : undefined}
      data-starting-style={context!.transitionStatus() === "starting" ? "" : undefined}
      data-ending-style={context!.transitionStatus() === "ending" ? "" : undefined}
      data-side={positioner!.side()}
      data-align={positioner!.align()}
      style={popupStyle()}
      onKeyDown={handleKeyDown}
      onFocusOut={handleFocusOut}
      onTransitionEnd={finishTransition}
      onAnimationEnd={finishTransition}
    >
      {props.children}
    </div>
  );
}

export namespace PopoverPopup {
  export type State = PopoverPopupState;
  export type Props = PopoverPopupProps;
}
