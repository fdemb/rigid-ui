import { createSignal } from "solid-js";
import { useDialogRootContext } from "../root/DialogRootContext";
import { renderElement } from "../../internals/renderElement";
import { popupTransitionStateMapping } from "../../utils/popupStateMapping";
import type { StateAttributesMapping } from "../../internals/getStateAttributesProps";
import {
  createPopupFocusManager,
  type PopupFocusTarget,
} from "../../utils/createPopupFocusManager";
import { type PopupNativeProps } from "../../utils/domProps";
import type { DialogInteractionType, DialogTransitionStatus } from "../types";

export interface DialogPopupState {
  open: boolean;
  transitionStatus: DialogTransitionStatus;
  nested: boolean;
  nestedDialogOpen: boolean;
}

export interface DialogPopupProps extends PopupNativeProps<HTMLDivElement> {
  /**
   * Determines the element to focus when the dialog is opened. By default focus moves to the
   * first tabbable element inside the popup, except when the dialog is opened by touch — then
   * the popup itself is focused to avoid opening the virtual keyboard.
   */
  initialFocus?: PopupFocusTarget;
  /** Determines the element to focus when the dialog is closed. */
  finalFocus?: PopupFocusTarget;
}

/**
 * The default `initialFocus` resolver: on touch opens, focus the popup itself so the virtual
 * keyboard stays closed; otherwise use the default behavior.
 */
function createTouchAwareInitialFocus(
  popup: () => HTMLElement | null | undefined,
): (interactionType: DialogInteractionType) => boolean | HTMLElement | null {
  return (interactionType) => (interactionType === "touch" ? (popup() ?? true) : true);
}

const NESTED_DIALOG_OPEN_HOOK = { "data-nested-dialog-open": "" };

// `getStateAttributesProps` lowercases keys verbatim, so the camelCase state key needs an explicit
// kebab-case attribute mapping.
const nestedDialogOpenMapping = {
  nestedDialogOpen(value: boolean) {
    return value ? NESTED_DIALOG_OPEN_HOOK : null;
  },
} satisfies StateAttributesMapping<{ nestedDialogOpen: boolean }>;

export function DialogPopup(props: DialogPopupProps) {
  const context = useDialogRootContext();
  const [element, setElement] = createSignal<HTMLDivElement>();

  const resolvedInitialFocus = (): PopupFocusTarget =>
    props.initialFocus ?? createTouchAwareInitialFocus(element);

  const focusManager = createPopupFocusManager({
    popup: element,
    trigger: () => context!.activeTrigger()?.element() ?? null,
    open: () => context!.open(),
    disabled: () => !context!.mounted(),
    modal: () => context!.modal() !== false,
    portalContainer: () => context!.portalElement() ?? null,
    closeOnFocusOut: () => !context!.disablePointerDismissal(),
    restoreFocus: "popup",
    get initialFocus() {
      return resolvedInitialFocus();
    },
    finalFocus: props.finalFocus ?? true,
    openMethod: () => context!.openMethod(),
    onRequestClose: (event) => context!.requestOpen(false, "focus-out", event),
  });

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "Escape" || event.key === "Tab") return;
    // Composite navigation keys must not leak out of a dialog into ancestors.
    if (
      [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "Home",
        "End",
        "PageUp",
        "PageDown",
      ].includes(event.key)
    ) {
      event.stopPropagation();
    }
  }

  return (
    <>
      {focusManager.renderBeforeGuard()}
      <div
        {...renderElement<
          HTMLDivElement,
          {
            open: boolean;
            transitionStatus: DialogTransitionStatus;
            nested: boolean;
            nestedDialogOpen: boolean;
          }
        >(props as Record<string, unknown>, {
          props: [
            {
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
              get hidden() {
                return !context!.mounted();
              },
              get style() {
                return { "--nested-dialogs": context!.nestedOpenDialogCount() };
              },
              onKeyDown: handleKeyDown,
            },
          ],
          state: () => ({
            open: context!.open(),
            transitionStatus: context!.transitionStatus(),
            nested: context!.nested,
            nestedDialogOpen: context!.nestedOpenDialogCount() > 0,
          }),
          stateAttributesMapping: { ...popupTransitionStateMapping, ...nestedDialogOpenMapping },
          ref: [setElement, (node: HTMLDivElement) => context!.setPopupElement(node)],
          exclude: ["initialFocus", "finalFocus", "id"],
        })}
      >
        {props.children}
      </div>
      {focusManager.renderAfterGuard()}
    </>
  );
}

export namespace DialogPopup {
  export type State = DialogPopupState;
  export type Props = DialogPopupProps;
}
