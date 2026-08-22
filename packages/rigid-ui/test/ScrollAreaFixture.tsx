import { expect } from "vite-plus/test";
import { ScrollArea, type ScrollAreaRootProps } from "../src/scroll-area";

export const VIEWPORT_SIZE = 200;
export const SCROLLABLE_CONTENT_SIZE = 1000;

/**
 * Replaces `ResizeObserver` with a mock whose deliveries the test drives explicitly, so
 * measurement passes can be attributed to the mount compute rather than to observer timing.
 */
export async function withMockResizeObserver(
  test: (notifyResizeObserver: () => void) => Promise<void>,
) {
  const originalResizeObserver = globalThis.ResizeObserver;
  const observers = new Set<ResizeObserverMock>();

  class ResizeObserverMock implements ResizeObserver {
    callback: ResizeObserverCallback;

    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }

    observe() {
      observers.add(this);
    }

    unobserve() {}

    disconnect() {
      observers.delete(this);
    }

    takeRecords(): ResizeObserverEntry[] {
      return [];
    }
  }

  globalThis.ResizeObserver = ResizeObserverMock;

  try {
    await test(() => {
      expect(observers.size).toBeGreaterThan(0);
      observers.forEach((observer) => observer.callback([], observer));
    });
  } finally {
    globalThis.ResizeObserver = originalResizeObserver;
  }
}

/**
 * JSDOM reports every layout metric as 0. Pin the four the scroll area measures so the overflow
 * math has something to work with.
 */
export function mockViewportMetrics(
  viewport: HTMLElement,
  metrics: Partial<
    Record<"clientHeight" | "scrollHeight" | "clientWidth" | "scrollWidth", number>
  > = {},
) {
  const resolved = {
    clientHeight: VIEWPORT_SIZE,
    scrollHeight: SCROLLABLE_CONTENT_SIZE,
    clientWidth: VIEWPORT_SIZE,
    scrollWidth: SCROLLABLE_CONTENT_SIZE,
    ...metrics,
  };

  for (const [key, value] of Object.entries(resolved)) {
    Object.defineProperty(viewport, key, { value, configurable: true });
  }
}

/**
 * JSDOM's `scrollTop`/`scrollLeft` setters are no-ops for elements it considers unscrollable, so
 * assign through a redefined property and dispatch the scroll event by hand.
 */
export function scrollViewport(
  viewport: HTMLElement,
  position: { scrollTop?: number; scrollLeft?: number },
) {
  for (const [key, value] of Object.entries(position)) {
    Object.defineProperty(viewport, key, { value, configurable: true, writable: true });
  }
  viewport.dispatchEvent(new Event("scroll"));
}

interface ScrollAreaFixtureProps {
  contentHeight?: number;
  contentWidth?: number;
  keepMounted?: boolean;
  rootProps?: Omit<ScrollAreaRootProps, "children" | "ref">;
}

export function ScrollAreaFixture(props: ScrollAreaFixtureProps) {
  return (
    <ScrollArea.Root
      data-testid="root"
      {...props.rootProps}
      style={{
        position: "relative",
        width: "200px",
        height: "200px",
        ...(typeof props.rootProps?.style === "object" ? props.rootProps.style : {}),
      }}
    >
      <ScrollArea.Viewport data-testid="viewport" style={{ width: "100%", height: "100%" }}>
        <ScrollArea.Content
          data-testid="content"
          style={{
            width: `${props.contentWidth ?? 1000}px`,
            height: `${props.contentHeight ?? 1000}px`,
          }}
        />
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar
        data-testid="scrollbar-y"
        keepMounted={props.keepMounted}
        style={{ width: "10px" }}
      >
        <ScrollArea.Thumb data-testid="thumb-y" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Scrollbar
        data-testid="scrollbar-x"
        orientation="horizontal"
        keepMounted={props.keepMounted}
        style={{ height: "10px" }}
      >
        <ScrollArea.Thumb data-testid="thumb-x" />
      </ScrollArea.Scrollbar>
      <ScrollArea.Corner data-testid="corner" />
    </ScrollArea.Root>
  );
}
