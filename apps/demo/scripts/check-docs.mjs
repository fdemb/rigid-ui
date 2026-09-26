import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const dist = new URL("../dist/", import.meta.url);
const docs = new URL("../src/docs/", import.meta.url);
const html = await readFile(new URL("index.html", dist), "utf8");
const entry = html.match(/<script[^>]+src="([^"]+)"/)?.[1];
assert.ok(entry, "Build the demo before checking documentation");
const base = entry.slice(0, entry.indexOf("assets/"));
const route = process.argv[2];

if (!route) {
  const files = (await readdir(docs, { recursive: true })).filter((file) => file.endsWith(".mdx"));
  const pages = await Promise.all(
    files.map(async (file) => {
      const source = await readFile(new URL(file, docs), "utf8");
      const title = source.match(/^# (.+)$/m)?.[1];
      assert.ok(title, `Missing title in ${file}`);
      const path =
        file === "introduction.mdx"
          ? "/docs"
          : file === "theming.mdx"
            ? "/docs/theming"
            : `/${file.replace(/\.mdx$/, "")}`;
      return [path, title];
    }),
  );
  pages.push(
    ["/", ""],
    ["/elements", "Components"],
    ["/missing-page", "Nothing at this path"],
    ["/primitives/missing", "Nothing at this path"],
  );
  for (const [path, title] of pages) {
    const result = spawnSync(process.execPath, [fileURLToPath(import.meta.url), path, title], {
      stdio: "inherit",
    });
    assert.equal(result.status, 0, `Documentation failed at ${path}`);
  }
  for (const preference of ["dark", "system-dark"]) {
    const result = spawnSync(
      process.execPath,
      [fileURLToPath(import.meta.url), "/docs/theming", "Theming", preference],
      { stdio: "inherit" },
    );
    assert.equal(result.status, 0, `Theme initialization failed for ${preference}`);
  }
  console.log(`Checked ${pages.length} routes from the production build at ${base}`);
} else {
  const dom = new JSDOM(html, {
    url: `http://localhost${base.replace(/\/$/, "")}${route}`,
    pretendToBeVisual: true,
  });
  const { window } = dom;
  for (const key of [
    "window",
    "document",
    "navigator",
    "location",
    "history",
    "localStorage",
    "HTMLElement",
    "Element",
    "Node",
    "ShadowRoot",
    "NodeFilter",
    "HTMLButtonElement",
    "HTMLInputElement",
    "HTMLAnchorElement",
    "HTMLFormElement",
    "HTMLSelectElement",
    "SVGElement",
    "MutationObserver",
    "Event",
    "PointerEvent",
    "CustomEvent",
    "MouseEvent",
    "KeyboardEvent",
    "getComputedStyle",
    "requestAnimationFrame",
    "cancelAnimationFrame",
  ]) {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value:
        key === "window"
          ? window
          : typeof window[key] === "function" && /^[a-z]/.test(key)
            ? window[key].bind(window)
            : window[key],
    });
  }
  // JSDOM has no layout or media-query engine. These checks exercise DOM,
  // routing, and events, not positioning or responsive appearance.
  window.matchMedia = globalThis.matchMedia = () => ({
    matches: process.argv[4] === "system-dark",
    addEventListener() {},
    removeEventListener() {},
  });
  window.scrollTo = () => {};
  if (process.argv[4] === "dark") localStorage.setItem("rigid-ui-theme", "dark");
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  // Vite's modulepreload fallback fetches chunks using their file URLs here.
  globalThis.fetch = async (url) => {
    const resource = new URL(url instanceof Request ? url.url : url);
    assert.ok(resource.protocol === "file:" || resource.origin === window.location.origin);
    const assetIndex = resource.pathname.lastIndexOf("/assets/");
    assert.ok(assetIndex >= 0, `Unexpected fetch: ${resource.href}`);
    const file = new URL(resource.pathname.slice(assetIndex + 1), dist);
    return new Response(await readFile(file));
  };

  const errors = [];
  window.addEventListener("error", (event) => errors.push(event.error));
  await import(new URL(entry.slice(base.length), dist));
  async function waitFor(check) {
    for (let attempt = 0; attempt < 100; attempt++) {
      if (check()) return;
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    throw new Error(`Timed out at ${route}: ${document.body.textContent.slice(0, 500)}`);
  }
  await waitFor(() => document.querySelector("main h1"));
  assert.equal(document.querySelectorAll("main").length, 1);
  assert.equal(document.querySelectorAll("h1").length, 1);
  if (process.argv[3]) assert.equal(document.querySelector("h1").textContent, process.argv[3]);
  for (const link of document.querySelectorAll(".docs-outline a")) {
    assert.ok(document.getElementById(link.hash.slice(1)), `Missing heading ${link.hash}`);
  }
  for (const link of document.querySelectorAll(".docs-navigation a")) {
    assert.ok(link.pathname.startsWith(base), `Link lost deployment base: ${link.href}`);
  }
  if (document.querySelector(".docs-prose")) {
    assert.equal(document.title, `${process.argv[3]} - Rigid UI`);
    assert.equal(
      document.querySelectorAll(".docs-sidebar a[aria-current='page']").length,
      route === "/elements" ? 0 : 1,
    );
  }
  if (route === "/components/meter") {
    const meters = Array.from(document.querySelectorAll('[role="meter"]'));
    assert.equal(meters.length, 2);
    for (const [index, meter] of meters.entries()) {
      assert.equal(meter.getAttribute("aria-valuenow"), index === 0 ? "64" : "640");
      assert.equal(
        document.getElementById(meter.getAttribute("aria-labelledby")).textContent,
        "Storage usage",
      );
      const value = meter.querySelector('[aria-hidden="true"]');
      assert.equal(value.textContent, index === 0 ? "64%" : "640 GB");
      assert.ok(meter.querySelector('[style*="width: 64%"]'));
      assert.ok(meter.className, "Styled meter must receive compiled StyleX classes");
    }
  }
  if (route === "/components/dialog") {
    const lightClasses = document.documentElement.className;
    Array.from(document.querySelectorAll("button"))
      .find((button) => button.getAttribute("aria-label") === "Dark theme")
      .click();
    await waitFor(() => document.documentElement.className !== lightClasses);
    document.querySelector(".docs-prose section button").click();
    await waitFor(() => document.querySelector('[role="dialog"]'));
    const popup = document.querySelector('[role="dialog"]');
    assert.ok(popup.closest("[data-rigid-ui-portal]"));
    assert.equal(document.getElementById("root").contains(popup), false);
    assert.ok(
      document.documentElement.contains(popup),
      "Body-mounted dialogs must share the document theme",
    );
    const cancel = Array.from(document.querySelectorAll('[role="dialog"] button')).find(
      (button) => button.textContent === "Cancel",
    );
    assert.ok(cancel);
    cancel.click();
    await waitFor(() => !document.querySelector('[role="dialog"]'));
  }
  if (route === "/docs/theming") {
    const darkButton = document.querySelector('button[aria-label="Dark theme"]');
    const lightButton = document.querySelector('button[aria-label="Light theme"]');
    const startsDark = process.argv[4] === "dark" || process.argv[4] === "system-dark";
    assert.equal(darkButton.getAttribute("aria-pressed"), String(startsDark));
    assert.ok(
      document.documentElement.className,
      "Apply theme classes to html, including on initial render",
    );
    const initialClasses = document.documentElement.className;
    (startsDark ? lightButton : darkButton).click();
    await waitFor(() => darkButton.getAttribute("aria-pressed") === String(!startsDark));
    assert.notEqual(document.documentElement.className, initialClasses);
    assert.equal(localStorage.getItem("rigid-ui-theme"), startsDark ? "light" : "dark");
    (startsDark ? darkButton : lightButton).click();
    await waitFor(() => document.documentElement.className === initialClasses);

    const preview = document.querySelector('[role="group"][aria-label="Theme preview"]');
    const colorClasses = preview.parentElement.className;
    const initialPreviewClasses = preview.className;
    const button = (name) =>
      Array.from(document.querySelectorAll("button")).find(
        (element) => element.textContent === name,
      );
    button("Compact controls").click();
    await waitFor(() => preview.className !== initialPreviewClasses);
    const compactClasses = preview.className;
    button("Rounder corners").click();
    await waitFor(() => preview.className !== compactClasses);
    assert.equal(
      preview.parentElement.className,
      colorClasses,
      "Shape and density must preserve the selected color theme",
    );
    button("Details").click();
    await waitFor(() => preview.querySelector('[role="dialog"]'));
    const popup = preview.querySelector('[role="dialog"]');
    assert.ok(
      popup.closest('[role="group"][aria-label="Theme preview"]'),
      "Scoped popups must inherit local token overrides",
    );
    button("Dark preview").click();
    await waitFor(() => preview.parentElement.className !== colorClasses);
    assert.ok(preview.contains(popup), "Changing a scoped theme must retain the open popup");
    popup.querySelector("button").click();
    await waitFor(() => !preview.querySelector('[role="dialog"]'));
    button("Rounder corners").click();
    button("Compact controls").click();
    await waitFor(() => preview.className === initialPreviewClasses);
  }
  if (route === "/components/button") {
    const destination = Array.from(document.querySelectorAll(".docs-mobile-navigation a")).find(
      (link) => link.pathname.endsWith("/primitives/dialog"),
    );
    document.querySelector(".docs-mobile-navigation").open = true;
    destination.click();
    await waitFor(() => document.querySelector("h1")?.textContent === "Dialog");
    assert.equal(document.querySelector(".docs-mobile-navigation").open, false);
    assert.ok(
      document.querySelector(".docs-prose").textContent.includes("rigid-ui/primitives/dialog"),
    );
    assert.equal(document.querySelectorAll("main").length, 1);
    assert.equal(document.title, "Dialog - Rigid UI");
  }
  assert.deepEqual(errors, []);
  console.log(`PASS ${route}`);
  dom.window.close();
  process.exit(0);
}
