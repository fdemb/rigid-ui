import { createSignal, omit } from "solid-js";
import type { JSX } from "@solidjs/web";
import { useDialogRootContext } from "../root/DialogRootContext";
import { assignRef, mergeStyles, type PopupNativeProps } from "../../utils/domProps";
import {
  createPopupFocusManager,
  type PopupFocusTarget,
} from "../../utils/createPopupFocusManager";
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

export function DialogPopup(props: DialogPopupProps) {
  const context = useDialogRootContext();
  const others = omit(props, "ref", "children", "initialFocus", "finalFocus", "style");
  const [element, setElement] = createSignal<HTMLDivElement>();

  const resolvedInitialFocus = (): PopupFocusTarget =>
    props.initialFocus ?? createTouchAwareInitialFocus(element);

  const focusManager = createPopupFocusManager({
    popup: element,
    trigger: () => context!.activeTrigger()?.element() ?? null,
    open: () => context!.open(),
    disabled: () => !context!.mounted(),
    modal: () => context!.modal() !== false,
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

  function popupStyle(): JSX.CSSProperties | string {
    return mergeStyles(
      {
        "--nested-dialogs": context!.nestedOpenDialogCount(),
      },
      props.style,
    );
  }

  return (
    <>
      {focusManager.renderBeforeGuard()}
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
        hidden={!context!.mounted()}
        data-open={context!.open() ? "" : undefined}
        data-closed={!context!.open() ? "" : undefined}
        data-starting-style={context!.transitionStatus() === "starting" ? "" : undefined}
        data-ending-style={context!.transitionStatus() === "ending" ? "" : undefined}
        data-nested={context!.nested ? "" : undefined}
        data-nested-dialog-open={context!.nestedOpenDialogCount() > 0 ? "" : undefined}
        style={popupStyle()}
        onKeyDown={handleKeyDown}
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
