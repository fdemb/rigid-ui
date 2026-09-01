import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import solidPlugin from "@solidjs/vite-plugin";
import stylex from "@stylexjs/unplugin";
import { defineConfig, lazyPlugins } from "vite-plus";
import type { Plugin } from "vite-plus";

/**
 * Emits a byte-copy of the built index.html as 404.html. GitHub Pages serves
 * 404.html — at the originally requested URL — for any path without a file,
 * which is what makes history-API deep links work on the project site. Dev
 * needs nothing: Vite's dev server already falls back to index.html.
 */
function spaFallback(): Plugin {
  let outDir = "";
  return {
    name: "spa-fallback",
    apply: "build",
    configResolved(config) {
      outDir = join(config.root, config.build.outDir);
    },
    // Runs after every plugin has contributed to the bundle, so `index.html`
    // is guaranteed to be present.
    writeBundle(_, bundle) {
      const html = bundle["index.html"];
      if (!html || html.type !== "asset") return;
      const source =
        typeof html.source === "string" ? html.source : Buffer.from(html.source).toString();
      mkdirSync(outDir, { recursive: true });
      writeFileSync(join(outDir, "404.html"), source);
    },
  };
}

export default defineConfig({
  plugins: lazyPlugins(() => [
    stylex.vite({
      dev: process.env.NODE_ENV !== "production",
      runtimeInjection: false,
      sxPropName: false,
      // StyleX writes a layer-order statement at the top of its own stylesheet,
      // so repeating the two layer names globals.css uses puts them ahead of
      // the priority layers even when the StyleX sheet loads first. It does
      // load first in dev: `virtual:stylex.css` is a <link> in the head, while
      // globals.css only arrives once the module graph evaluates.
      useCSSLayers: { before: ["reset", "base"] },
    }),
    solidPlugin(),
    spaFallback(),
  ]),
  base: process.env.GITHUB_ACTIONS ? "/rigid-ui/" : "/",
  server: {
    port: 3333,
  },
  // The demo consumes `rigid-ui` through its published `exports` map rather than
  // aliasing to source, so every demo build exercises the packaged artifact. That
  // makes `dist` a prerequisite: build the library before anything runs here.
  run: {
    tasks: {
      dev: {
        command: "vp dev",
        cache: false,
        dependsOn: [{ task: "build", from: "dependencies" }],
      },
      build: {
        command: "vp build",
        dependsOn: [{ task: "build", from: "dependencies" }],
      },
      preview: {
        command: "vp preview",
        cache: false,
        dependsOn: ["build"],
      },
    },
  },
});
