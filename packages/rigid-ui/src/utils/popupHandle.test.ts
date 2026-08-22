import { describe, expect, it, vi } from "vite-plus/test";
import { flushMicrotasks } from "../../test/test-utils";
import { PopupHandle } from "./popupHandle";
import type { PopupHandleRoot } from "./popupHandle";
import { REASONS } from "../internals/reasons";

interface FakeRoot extends PopupHandleRoot {
  log: string[];
}

function createFakeRoot(): FakeRoot {
  const log: string[] = [];
  return {
    log,
    open: () => true,
    requestOpen(open, reason) {
      log.push(`${open ? "open" : "close"}:${reason}`);
      return true;
    },
  };
}

class TestHandle extends PopupHandle<FakeRoot> {
  constructor() {
    super("Test");
  }
  openById(id: string) {
    this.attachedRoot()?.requestOpen(true, REASONS.triggerPress, undefined, id);
  }
}

/** Contracts inherited from the two per-component handles this base replaces. */
describe("PopupHandle", () => {
  it("exposes the attached root reactively through context()", async () => {
    const handle = new TestHandle();
    expect(handle.context()).toBeUndefined();

    const root = createFakeRoot();
    const detach = handle.attach(root);
    // The reactive view settles on the next flush; imperative paths read the plain field.
    await flushMicrotasks();
    expect(handle.context()).toBe(root);

    detach();
    await flushMicrotasks();
    expect(handle.context()).toBeUndefined();
  });

  it("warns when a second root attaches while one is mounted", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const handle = new TestHandle();
    const first = createFakeRoot();
    const second = createFakeRoot();

    const detachFirst = handle.attach(first);
    handle.attach(second);

    expect(warn).toHaveBeenCalledTimes(1);
    await flushMicrotasks();
    expect(handle.context()).toBe(second);

    // Detaching the displaced root must not unmount the live one.
    detachFirst();
    await flushMicrotasks();
    expect(handle.context()).toBe(second);

    warn.mockRestore();
  });

  it("detaches only its own root", async () => {
    const handle = new TestHandle();
    const root = createFakeRoot();
    const detach = handle.attach(root);

    const staleDetach = handle.attach(createFakeRoot());
    staleDetach();

    expect(handle.isOpen).toBe(false);

    detach();
    await flushMicrotasks();
    expect(handle.context()).toBeUndefined();
  });

  it("routes imperative close through the imperative-action reason", () => {
    const handle = new TestHandle();
    const root = createFakeRoot();
    handle.attach(root);

    handle.close();
    expect(root.log).toEqual([`close:${REASONS.imperativeAction}`]);
  });

  it("reports isOpen from the attached root and false while detached", () => {
    const handle = new TestHandle();
    expect(handle.isOpen).toBe(false);

    handle.attach({ ...createFakeRoot(), open: () => true });
    expect(handle.isOpen).toBe(true);
  });

  it("makes imperative calls no-ops while detached", () => {
    const handle = new TestHandle();
    expect(() => handle.close()).not.toThrow();
    expect(() => handle.openById("t1")).not.toThrow();
    expect(handle.isOpen).toBe(false);
  });

  it("supports subclasses forwarding trigger ids to their roots", () => {
    const handle = new TestHandle();
    const root = createFakeRoot();
    handle.attach(root);

    handle.openById("trigger-7");
    expect(root.log).toEqual([`open:${REASONS.triggerPress}`]);
  });
});
