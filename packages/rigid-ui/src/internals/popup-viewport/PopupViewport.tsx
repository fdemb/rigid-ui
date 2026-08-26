import { createEffect, createSignal, For, onCleanup, Show, untrack, type Accessor } from "solid-js";
import type { JSX } from "@solidjs/web";
import { renderElement } from "../renderElement";
import type { PopupNativeProps } from "../../utils/domProps";
import { runOnceAnimationsFinish } from "../../utils/runOnceAnimationsFinish";
import { createPopupAutoResize } from "../../utils/createPopupAutoResize";
import type { PhysicalSide } from "../../utils/createAnchorPositioning";

export interface PopupViewportRootContext<Instant extends string> {
  open: Accessor<boolean>;
  mounted: Accessor<boolean>;
  activeTriggerId: Accessor<string | null>;
  activeTriggerElement: Accessor<HTMLElement | undefined>;
  payload: Accessor<unknown>;
  popupElement: Accessor<HTMLElement | undefined>;
  positionerElement: Accessor<HTMLElement | undefined>;
  instantType: Accessor<Instant | undefined>;
}

export interface PopupViewportPositionerContext {
  physicalSide: Accessor<PhysicalSide>;
  registerViewport(): () => void;
}

export type PopupViewportState<Instant extends string> = {
  activationDirection: string | undefined;
  transitioning: boolean;
  instant: Instant | undefined;
};

export function createPopupViewport<Instant extends string>(
  props: PopupNativeProps<HTMLDivElement>,
  root: PopupViewportRootContext<Instant>,
  positioner: PopupViewportPositionerContext,
) {
  // renderElement composes the user ref automatically; children/ref never reach the DOM.
  const [currentElement, setCurrentElement] = createSignal<HTMLDivElement>();
  const [previousContainerElement, setPreviousContainerElement] = createSignal<HTMLDivElement>();
  const [contentKey, setContentKey] = createSignal("initial");
  const [previousContent, setPreviousContent] = createSignal<DocumentFragment>();
  const [previousDimensions, setPreviousDimensions] = createSignal<{
    width: number;
    height: number;
  }>();
  const [activationDirection, setActivationDirection] = createSignal<string>();
  // Held on the `data-current` container while it (re)mounts, so consumer CSS can hold the
  // entrance animation at its `from` state until the browser has had a chance to register it —
  // see the "arm/re-arm cleanup" effect below.
  const [showStartingStyle, setShowStartingStyle] = createSignal(false);

  const elementProps = renderElement<HTMLDivElement, PopupViewportState<Instant>>(props, {
    state: () => ({
      activationDirection: activationDirection(),
      transitioning: Boolean(previousContent()),
      instant: root.instantType(),
    }),
    stateAttributesMapping: {
      activationDirection(value) {
        return value === undefined ? null : { "data-activation-direction": value };
      },
    },
  });

  let previousTrigger: HTMLElement | undefined;
  // Guards against reprocessing the same trigger twice: the effect below reads `activeTrigger`
  // and `open`/`mounted` together, any of which can change independently and re-run it.
  let lastHandledTrigger: HTMLElement | undefined;
  let capturedContent: DocumentFragment | undefined;
  let cleanupPrevious: (() => void) | undefined;
  let contentRevision = 0;
  let previousActiveTriggerId: string | null | undefined;
  let previousPayload: unknown;
  // Set when a trigger switch bumps the content key before its payload has caught up, so a later
  // render that only changes the payload still gets a fresh DOM subtree instead of reusing one
  // built for the previous trigger (e.g. an `<img>` whose `src` comes from the payload).
  let pendingPayloadUpdate = false;

  // Read through an accessor so the retained size stays reactive: the container is created once per
  // transition, but `previousDimensions` lands afterwards, once the outgoing content is measured.
  const previousContainerStyle = () => {
    const dimensions = previousDimensions();
    return {
      position: "absolute",
      ...(dimensions
        ? { "--popup-width": `${dimensions.width}px`, "--popup-height": `${dimensions.height}px` }
        : undefined),
    } satisfies JSX.CSSProperties;
  };

  createEffect(
    () => true,
    () => positioner.registerViewport(),
  );

  createPopupAutoResize({
    popupElement: root.popupElement,
    positionerElement: root.positionerElement,
    mounted: root.mounted,
    content: root.payload,
    side: positioner.physicalSide,
    onMeasureLayout() {
      const current = currentElement();
      current?.style.setProperty("animation", "none");
      current?.style.setProperty("transition", "none");
      untrack(previousContainerElement)?.style.setProperty("display", "none");
    },
    onMeasureLayoutComplete(previous) {
      const current = currentElement();
      current?.style.removeProperty("animation");
      current?.style.removeProperty("transition");
      untrack(previousContainerElement)?.style.removeProperty("display");
      // `previous` is the outgoing content's measured size — retained on the previous snapshot so
      // it keeps rendering at that size instead of reflowing once cloned into its own container.
      if (previous) setPreviousDimensions(previous);
    },
  });

  // Capture the rendered DOM instead of retaining children. A trigger payload can contain stateful
  // Solid components, which must remain owned by the new panel while the old panel animates out.
  createEffect(
    () => [root.payload(), currentElement()] as const,
    ([, current]) => {
      if (!current) return;
      const fragment = current.ownerDocument.createDocumentFragment();
      for (const child of current.childNodes) fragment.append(child.cloneNode(true));
      capturedContent = fragment;
    },
  );

  // Remount current content on trigger changes (and once more when payload lags) to avoid DOM
  // reuse flashes. The key bumps immediately on trigger switches, then again if the payload
  // arrives on a later render.
  createEffect(
    () => [root.activeTriggerId(), root.payload()] as const,
    ([triggerId, payload]) => {
      const triggerIdChanged = triggerId !== previousActiveTriggerId;
      const payloadChanged = payload !== previousPayload;
      if (triggerIdChanged) {
        contentRevision += 1;
        setContentKey(`${triggerId ?? "current"}-${contentRevision}`);
        pendingPayloadUpdate = !payloadChanged;
      } else if (pendingPayloadUpdate && payloadChanged) {
        contentRevision += 1;
        setContentKey(`${triggerId ?? "current"}-${contentRevision}`);
        pendingPayloadUpdate = false;
      }
      previousActiveTriggerId = triggerId;
      previousPayload = payload;
    },
  );

  createEffect(
    () =>
      [root.open(), root.mounted(), root.activeTriggerElement(), root.activeTriggerId()] as const,
    ([open, mounted, trigger, _triggerId]) => {
      if (!open || !mounted) {
        previousTrigger = undefined;
        lastHandledTrigger = undefined;
        cleanupPrevious?.();
        cleanupPrevious = undefined;
        setPreviousContent(undefined);
        setPreviousDimensions(undefined);
        setShowStartingStyle(false);
        return;
      }
      if (
        trigger &&
        previousTrigger &&
        trigger !== previousTrigger &&
        lastHandledTrigger !== trigger &&
        capturedContent
      ) {
        const from = previousTrigger.getBoundingClientRect();
        const to = trigger.getBoundingClientRect();
        const horizontal = to.left + to.width / 2 - (from.left + from.width / 2);
        const vertical = to.top + to.height / 2 - (from.top + from.height / 2);
        const horizontalDirection = horizontal > 5 ? "right" : horizontal < -5 ? "left" : "";
        const verticalDirection = vertical > 5 ? "down" : vertical < -5 ? "up" : "";
        setActivationDirection(`${horizontalDirection} ${verticalDirection}`);
        setPreviousContent(capturedContent);
        setShowStartingStyle(true);
        lastHandledTrigger = trigger;
      }
      if (trigger) previousTrigger = trigger;
    },
  );

  // Arm cleanup once a previous snapshot exists, and re-arm it if the current container remounts
  // mid-transition (a rapid trigger switch, or `contentKey` bumping again for a lagging payload).
  // The remount discards the running entry animation, so the starting-style choreography must run
  // again too — otherwise the watcher below either strands or fires before the new entry animation
  // has even started.
  createEffect(
    () => [contentKey(), previousContent(), currentElement()] as const,
    ([, previous, current]) => {
      if (!previous || !current) return;
      const container = current;

      // Abort the stale watcher synchronously. The remount cancels the old container's animations,
      // and the resulting rejection would otherwise run the cleanup in a microtask before the
      // re-armed watcher below is in place.
      cleanupPrevious?.();
      cleanupPrevious = undefined;

      setShowStartingStyle(true);

      function arm() {
        setShowStartingStyle(false);
        cleanupPrevious = runOnceAnimationsFinish(
          container,
          () => {
            setPreviousContent(undefined);
            setPreviousDimensions(undefined);
            cleanupPrevious = undefined;
          },
          { waitForStartingStyle: true },
        );
      }

      if (typeof requestAnimationFrame === "undefined") {
        arm();
        return;
      }
      const frame = requestAnimationFrame(arm);
      // `arm` is the only other place that clears the flag, so canceling the frame has to clear it
      // too. Closing mid-transition re-runs this effect, which bails at the guard above without
      // ever arming — leaving `data-starting-style` stranded on the current container (and, with
      // `keepMounted`, freezing consumer entry styles at their `from` state on every later open).
      return () => {
        cancelAnimationFrame(frame);
        setShowStartingStyle(false);
      };
    },
  );

  // Populate the previous container imperatively rather than during render. The `<Show>` below is
  // unkeyed, so a second trigger switch mid-transition swaps `previousContent` while reusing the
  // same container element — reading the snapshot in the render body would pin the first one.
  createEffect(
    () => [previousContent(), previousContainerElement()] as const,
    ([content, container]) => {
      if (!content || !container) return;
      container.replaceChildren(...Array.from(content.childNodes));
    },
  );

  onCleanup(() => cleanupPrevious?.());

  return (
    <div {...elementProps}>
      <Show when={previousContent()}>
        {(_snapshot) => {
          // The container outlives individual snapshots, but not the transition itself — drop the
          // reference on unmount so the auto-resize callbacks never poke a detached node.
          onCleanup(() => setPreviousContainerElement(undefined));
          return (
            <div
              data-previous=""
              inert
              data-ending-style={showStartingStyle() ? undefined : ""}
              style={previousContainerStyle()}
              ref={setPreviousContainerElement}
            />
          );
        }}
      </Show>
      <For each={[contentKey()]}>
        {() => (
          <div
            data-current=""
            data-starting-style={showStartingStyle() ? "" : undefined}
            ref={setCurrentElement}
          >
            {props.children}
          </div>
        )}
      </For>
    </div>
  );
}
