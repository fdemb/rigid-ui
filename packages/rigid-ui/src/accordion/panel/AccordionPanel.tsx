import { createEffect, createSignal, untrack, Show } from "solid-js";
import type { JSX } from "@solidjs/web";
import { renderPart } from "../../internals/renderPart";
import { mergeProps } from "../../internals/mergeProps";
import type { PartProps } from "../../utils/domProps";
import { createOpenChangeComplete } from "../../internals/createOpenChangeComplete";
import { runOnceAnimationsFinish } from "../../utils/runOnceAnimationsFinish";
import { useAccordionRootContext } from "../root/AccordionRootContext";
import { useAccordionItemContext, type AccordionItemState } from "../item/AccordionItemContext";
import { accordionStateAttributesMapping } from "../item/stateAttributesMapping";
import * as AccordionPanelCssVars from "./AccordionPanelCssVars";
import type { TransitionStatus } from "../../internals/createTransitionStatus";

export interface AccordionPanelState extends AccordionItemState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface AccordionPanelProps extends PartProps<
  HTMLDivElement,
  JSX.HTMLAttributes<HTMLDivElement>,
  AccordionPanelState
> {
  /**
   * Allows the browser's built-in page search to find and expand the panel contents.
   *
   * Overrides the `keepMounted` prop and uses `hidden="until-found"`
   * to hide the element without removing it from the DOM.
   * @default false
   */
  hiddenUntilFound?: boolean | undefined;
  /**
   * Whether to keep the element in the DOM while the panel is hidden.
   * This prop is ignored when `hiddenUntilFound` is used.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

type AnimationType = "css-transition" | "css-animation" | "none";

interface Dimensions {
  height: number | undefined;
  width: number | undefined;
}

function getDimensions(element: HTMLElement): Dimensions {
  return {
    height: element.scrollHeight,
    width: element.scrollWidth,
  };
}

function hasNonZeroDuration(value: string) {
  return value
    .split(",")
    .map((part) => part.trim())
    .some((part) => part !== "" && Number.parseFloat(part) > 0);
}

function getAnimationType(element: HTMLElement): AnimationType {
  const panelStyles = getComputedStyle(element);
  const hasAnimation =
    panelStyles.animationName
      .split(",")
      .map((name) => name.trim())
      .some((name) => name !== "" && name !== "none") &&
    hasNonZeroDuration(panelStyles.animationDuration);
  const hasTransition = hasNonZeroDuration(panelStyles.transitionDuration);

  if (hasAnimation && hasTransition) {
    if (import.meta.env.DEV) {
      console.warn(
        "Base UI: CSS transitions and CSS animations both detected on Collapsible or Accordion panel. Only one of either animation type should be used.",
      );
    }
    return "css-transition";
  }

  if (hasTransition) {
    return "css-transition";
  }

  if (hasAnimation) {
    return "css-animation";
  }

  return "none";
}

function PanelIdPublisher(props: { registeredId: string | undefined }) {
  const itemContext = useAccordionItemContext();
  createEffect(
    () => props.registeredId,
    (registeredId) => {
      const store = itemContext!;
      store.setPanelId(registeredId);
      return () => {
        store.setPanelId((current: string | null | undefined) =>
          current === registeredId ? null : current,
        );
      };
    },
  );
  return null;
}

export function AccordionPanel(props: AccordionPanelProps) {
  const rootContext = useAccordionRootContext();
  const itemContext = useAccordionItemContext();
  const item = () => itemContext!;
  const root = () => rootContext!;

  const hiddenUntilFound = () => props.hiddenUntilFound ?? root().hiddenUntilFound();
  const keepMounted = () => props.keepMounted ?? root().keepMounted();

  if (import.meta.env.DEV) {
    if (untrack(() => props.keepMounted === false && hiddenUntilFound())) {
      console.warn(
        "Base UI: The `keepMounted={false}` prop on an `Accordion.Panel` is ignored when `hiddenUntilFound` is enabled on the panel or root, since the panel must remain mounted while closed.",
      );
    }
  }

  const open = () => item().open();
  const mounted = () => item().mounted();
  const transitionStatus = () => item().transitionStatus();

  const [element, setElement] = createSignal<HTMLDivElement>();
  const [dimensions, setDimensions] = createSignal<Dimensions>({
    height: undefined,
    width: undefined,
  });
  // Open paths that skip motion still advance the shared transition status asynchronously.
  // Override the panel to idle so its attributes and dimension cleanup reflect the open state.
  const [forcePanelIdle, setForcePanelIdle] = createSignal(false);
  // Keyframe mount animations on initially open panels cause a visible layout shift during the
  // first paint, so suppress that first open lifecycle until the panel has been closed once.
  const [hasClosedOnce, setHasClosedOnce] = createSignal(false);

  createEffect(
    () => open(),
    (isOpen) => {
      if (!isOpen) {
        setHasClosedOnce(true);
      }
    },
  );

  createEffect(
    () => forcePanelIdle() && transitionStatus() !== "starting",
    (shouldClear) => {
      if (shouldClear) {
        setForcePanelIdle(false);
      }
    },
  );

  const panelTransitionStatus = (): TransitionStatus =>
    forcePanelIdle() ? "idle" : transitionStatus();

  createEffect(
    () => ({
      panel: element(),
      isOpen: open(),
      status: transitionStatus(),
      isMounted: mounted(),
    }),
    ({ panel, isOpen, status, isMounted }) => {
      if (!panel || !panel.isConnected) {
        return;
      }
      if ((isOpen && status === "starting") || (!isOpen && isMounted)) {
        setDimensions(getDimensions(panel));
        if (isOpen && status === "starting" && getAnimationType(panel) === "none") {
          setForcePanelIdle(true);
        }
      }
    },
  );

  createOpenChangeComplete({
    enabled: () => open() && mounted() && panelTransitionStatus() === "idle",
    open,
    element,
    onComplete() {
      // The `finished` microtask can resolve after the render that set `open` to `false` but
      // before this watcher disposes, so re-check the latest value here. Clearing the measured
      // size in that window would make the close transition start from `height: 0` instead of
      // the expanded pixel height.
      if (!untrack(open)) {
        return;
      }
      setDimensions({ height: undefined, width: undefined });
    },
  });

  // Closing panels wait one frame before watching animations: the `ending` render has committed
  // with `[data-ending-style]` present, but Chrome can still register the exit transition one
  // frame later when an accordion closes one item while opening another.
  createEffect(
    () => ({
      isOpen: open(),
      isMounted: mounted(),
      status: transitionStatus(),
      panel: element(),
    }),
    ({ isOpen, isMounted, status, panel }) => {
      if (isOpen || !isMounted || status !== "ending") {
        return;
      }
      if (!panel || !panel.isConnected) {
        item().setMounted(false);
        return;
      }
      if (getAnimationType(panel) === "none") {
        item().setMounted(false);
        setDimensions({ height: undefined, width: undefined });
        return;
      }
      let aborted = false;
      let abortAnimations: (() => void) | undefined;
      const frame = requestAnimationFrame(() => {
        if (aborted || untrack(open)) {
          return;
        }
        abortAnimations = runOnceAnimationsFinish(panel, () => {
          // The panel may have reopened while the exit animation was in flight; unmounting it
          // then would drop it from the DOM.
          if (!untrack(open) && !aborted) {
            item().setMounted(false);
            setDimensions({ height: undefined, width: undefined });
          }
        });
      });
      return () => {
        aborted = true;
        cancelAnimationFrame(frame);
        abortAnimations?.();
      };
    },
  );

  createEffect(
    () => element(),
    (panel) => {
      if (!panel) {
        return;
      }
      const handleBeforeMatch = (event: Event) => {
        item().requestPanelOpen(true, event);
      };
      panel.addEventListener("beforematch", handleBeforeMatch);
      return () => {
        panel.removeEventListener("beforematch", handleBeforeMatch);
      };
    },
  );

  const hidden = () => !open() && !mounted();
  const shouldRender = () => keepMounted() || hiddenUntilFound() || mounted() || open();

  const state = (): AccordionPanelState => ({
    ...item().state(),
    transitionStatus: panelTransitionStatus(),
  });

  const height = () => {
    if (open() && panelTransitionStatus() === "idle") {
      return undefined;
    }
    return dimensions().height;
  };
  const width = () => {
    if (open() && panelTransitionStatus() === "idle") {
      return undefined;
    }
    return dimensions().width;
  };

  const registeredId = (): string | undefined =>
    typeof props.id === "string" ? props.id : undefined;

  return (
    <Show when={shouldRender()}>
      <PanelIdPublisher registeredId={registeredId()} />
      {renderPart<HTMLDivElement, AccordionPanelState>("div", props, {
        state,
        stateAttributesMapping: accordionStateAttributesMapping,
        props: [
          {
            get id() {
              return typeof props.id === "string" ? props.id : item().defaultPanelId;
            },
            role: "region",
            get "aria-labelledby"() {
              return item().triggerId();
            },
            get hidden() {
              if (!hidden()) {
                return undefined;
              }
              return hiddenUntilFound() ? "until-found" : true;
            },
            get style() {
              return {
                [AccordionPanelCssVars.accordionPanelHeight]:
                  height() === undefined ? "auto" : `${height()}px`,
                [AccordionPanelCssVars.accordionPanelWidth]:
                  width() === undefined ? "auto" : `${width()}px`,
              };
            },
          },
        ],
        // The temporary override must use the kebab-case property name: style objects that
        // flow through the merged render bags are applied verbatim (`setProperty` semantics),
        // so camelCase keys never land. See RUI-71.
        propsGetter: (previous) =>
          mergeProps(previous, {
            get style() {
              const previousStyle = (previous as { style?: unknown }).style;
              if (!(open() && !hasClosedOnce())) {
                return previousStyle as JSX.CSSProperties | string | undefined;
              }
              if (typeof previousStyle === "string") {
                return `${previousStyle};animation-name:none`;
              }
              return { ...(previousStyle as object | undefined), "animation-name": "none" };
            },
          }),
        ref: [setElement],
        exclude: ["hiddenUntilFound", "keepMounted", "id"],
      })}
    </Show>
  );
}

export namespace AccordionPanel {
  export type State = AccordionPanelState;
  export type Props = AccordionPanelProps;
}
