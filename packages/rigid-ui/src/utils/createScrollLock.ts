import { createEffect, type Accessor } from "solid-js";
import { isOverflowElement } from "@floating-ui/utils/dom";
import { isWebKit } from "./detectBrowser";

let originalHtmlStyles: Partial<CSSStyleDeclaration> = {};
let originalBodyStyles: Partial<CSSStyleDeclaration> = {};
let originalHtmlScrollBehavior = "";

function getViewportScroller(html: HTMLElement, body: HTMLElement) {
  return isOverflowElement(html) ? html : body;
}

function isPageScrollLocked(win: typeof window, html: HTMLElement, body: HTMLElement) {
  return /hidden|clip/.test(win.getComputedStyle(getViewportScroller(html, body)).overflowY);
}

function hasInsetScrollbars(referenceElement: Element | null) {
  if (typeof document === "undefined") {
    return false;
  }
  const doc = referenceElement?.ownerDocument ?? document;
  const win = doc.defaultView ?? window;
  return win.innerWidth - doc.documentElement.clientWidth > 0;
}

function supportsStableScrollbarGutter(referenceElement: Element | null) {
  const supported =
    typeof CSS !== "undefined" && CSS.supports && CSS.supports("scrollbar-gutter", "stable");

  if (!supported || typeof document === "undefined") {
    return false;
  }

  const doc = referenceElement?.ownerDocument ?? document;
  const html = doc.documentElement;
  const body = doc.body;

  const scrollContainer = getViewportScroller(html, body);

  const originalScrollContainerOverflowY = scrollContainer.style.overflowY;
  const originalHtmlStyleGutter = html.style.scrollbarGutter;

  html.style.scrollbarGutter = "stable";

  scrollContainer.style.overflowY = "scroll";
  const before = scrollContainer.offsetWidth;

  scrollContainer.style.overflowY = "hidden";
  const after = scrollContainer.offsetWidth;

  scrollContainer.style.overflowY = originalScrollContainerOverflowY;
  html.style.scrollbarGutter = originalHtmlStyleGutter;

  return before === after;
}

function preventScrollOverlayScrollbars(referenceElement: Element | null) {
  const doc = referenceElement?.ownerDocument ?? document;
  const html = doc.documentElement;
  const body = doc.body;

  const elementToLock = getViewportScroller(html, body);
  const originalElementToLockStyles = {
    overflowY: elementToLock.style.overflowY,
    overflowX: elementToLock.style.overflowX,
  };

  Object.assign(elementToLock.style, {
    overflowY: "hidden",
    overflowX: "hidden",
  });

  return () => {
    Object.assign(elementToLock.style, originalElementToLockStyles);
  };
}

function preventScrollInsetScrollbars(referenceElement: Element | null) {
  const doc = referenceElement?.ownerDocument ?? document;
  const html = doc.documentElement;
  const body = doc.body;
  const win = doc.defaultView ?? window;

  let scrollTop = 0;
  let scrollLeft = 0;
  let updateGutterOnly = false;
  let resizeFrame = 0;

  // Pinch-zoom in Safari causes a shift. Just don't lock scroll if there's any pinch-zoom.
  if (isWebKit && (win.visualViewport?.scale ?? 1) !== 1) {
    return () => {};
  }

  function lockScroll() {
    const htmlStyles = win.getComputedStyle(html);
    const bodyStyles = win.getComputedStyle(body);
    const htmlScrollbarGutterValue = htmlStyles.scrollbarGutter || "";
    const hasBothEdges = htmlScrollbarGutterValue.includes("both-edges");
    const scrollbarGutterValue = hasBothEdges ? "stable both-edges" : "stable";

    scrollTop = html.scrollTop;
    scrollLeft = html.scrollLeft;

    originalHtmlStyles = {
      scrollbarGutter: html.style.scrollbarGutter,
      overflowY: html.style.overflowY,
      overflowX: html.style.overflowX,
    };
    originalHtmlScrollBehavior = html.style.scrollBehavior;

    originalBodyStyles = {
      position: body.style.position,
      height: body.style.height,
      width: body.style.width,
      boxSizing: body.style.boxSizing,
      overflowY: body.style.overflowY,
      overflowX: body.style.overflowX,
      scrollBehavior: body.style.scrollBehavior,
    };

    const isScrollableY = html.scrollHeight > html.clientHeight;
    const isScrollableX = html.scrollWidth > html.clientWidth;
    const hasConstantOverflowY =
      htmlStyles.overflowY === "scroll" || bodyStyles.overflowY === "scroll";
    const hasConstantOverflowX =
      htmlStyles.overflowX === "scroll" || bodyStyles.overflowX === "scroll";

    // Values can be negative in Firefox
    const scrollbarWidth = Math.max(0, win.innerWidth - body.clientWidth);
    const scrollbarHeight = Math.max(0, win.innerHeight - body.clientHeight);

    const marginY =
      (parseFloat(bodyStyles.marginTop) || 0) + (parseFloat(bodyStyles.marginBottom) || 0);
    const marginX =
      (parseFloat(bodyStyles.marginLeft) || 0) + (parseFloat(bodyStyles.marginRight) || 0);
    const elementToLock = getViewportScroller(html, body);

    updateGutterOnly = supportsStableScrollbarGutter(referenceElement);

    if (updateGutterOnly) {
      html.style.scrollbarGutter = scrollbarGutterValue;
      elementToLock.style.overflowY = "hidden";
      elementToLock.style.overflowX = "hidden";
      return;
    }

    Object.assign(html.style, {
      scrollbarGutter: scrollbarGutterValue,
      overflowY: "hidden",
      overflowX: "hidden",
    });

    if (isScrollableY || hasConstantOverflowY) {
      html.style.overflowY = "scroll";
    }
    if (isScrollableX || hasConstantOverflowX) {
      html.style.overflowX = "scroll";
    }

    Object.assign(body.style, {
      position: "relative",
      height:
        marginY || scrollbarHeight ? `calc(100dvh - ${marginY + scrollbarHeight}px)` : "100dvh",
      width: marginX || scrollbarWidth ? `calc(100vw - ${marginX + scrollbarWidth}px)` : "100vw",
      boxSizing: "border-box",
      overflowY: "hidden",
      overflowX: "hidden",
      scrollBehavior: "unset",
    });

    body.scrollTop = scrollTop;
    body.scrollLeft = scrollLeft;
    html.setAttribute("data-rigid-ui-scroll-locked", "");
    html.style.scrollBehavior = "unset";
  }

  function cleanup() {
    Object.assign(html.style, originalHtmlStyles);
    Object.assign(body.style, originalBodyStyles);

    if (!updateGutterOnly) {
      html.scrollTop = scrollTop;
      html.scrollLeft = scrollLeft;
      html.removeAttribute("data-rigid-ui-scroll-locked");
      html.style.scrollBehavior = originalHtmlScrollBehavior;
    }
  }

  function handleResize() {
    cleanup();
    resizeFrame = requestAnimationFrame(lockScroll);
  }

  lockScroll();
  win.addEventListener("resize", handleResize);

  return () => {
    cancelAnimationFrame(resizeFrame);
    cleanup();
    win.removeEventListener("resize", handleResize);
  };
}

class ScrollLocker {
  lockCount = 0;
  restore: (() => void) | null = null;
  timeoutLock: ReturnType<typeof setTimeout> | null = null;
  timeoutUnlock: ReturnType<typeof setTimeout> | null = null;

  acquire(referenceElement: Element | null) {
    this.lockCount += 1;
    if (this.lockCount === 1 && this.restore === null) {
      this.timeoutLock = setTimeout(() => {
        this.timeoutLock = null;
        this.lock(referenceElement);
      }, 0);
    }
    return this.release;
  }

  release = () => {
    this.lockCount -= 1;
    if (this.lockCount === 0 && this.restore) {
      this.timeoutUnlock = setTimeout(() => {
        this.timeoutUnlock = null;
        this.unlock();
      }, 0);
    }
  };

  private unlock() {
    if (this.lockCount === 0 && this.restore) {
      this.restore();
      this.restore = null;
    }
  }

  private lock(referenceElement: Element | null) {
    if (this.lockCount === 0 || this.restore !== null) {
      return;
    }

    const doc = referenceElement?.ownerDocument ?? document;
    const html = doc.documentElement;
    const body = doc.body;
    const win = doc.defaultView ?? window;

    // The page is already locked by the site author or another overlay. Leave it alone and
    // wait for that lock to clear before taking over, otherwise we would snapshot the locked
    // state and restore it after our own lock is released.
    if (isPageScrollLocked(win, html, body)) {
      const observer = new MutationObserver(() => {
        if (isPageScrollLocked(win, html, body)) {
          return;
        }
        observer.disconnect();
        this.restore = null;
        this.lock(referenceElement);
      });

      observer.observe(html, { attributes: true });
      observer.observe(body, { attributes: true });

      this.restore = () => observer.disconnect();
      return;
    }

    const hasOverlayScrollbars = !hasInsetScrollbars(referenceElement);

    this.restore = hasOverlayScrollbars
      ? preventScrollOverlayScrollbars(referenceElement)
      : preventScrollInsetScrollbars(referenceElement);
  }
}

const SCROLL_LOCKER = new ScrollLocker();

export function createScrollLock(
  enabled: Accessor<boolean>,
  referenceElement: () => Element | null | undefined = () => null,
) {
  createEffect(
    () => [enabled(), referenceElement() ?? null] as const,
    ([isEnabled, element]) => {
      if (!isEnabled) return;
      return SCROLL_LOCKER.acquire(element);
    },
  );
}
