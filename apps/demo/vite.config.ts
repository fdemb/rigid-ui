import { fileURLToPath } from "node:url";
import solidPlugin from "@solidjs/vite-plugin";
import { defineConfig, lazyPlugins } from "vite-plus";

const librarySrc = fileURLToPath(new URL("../../packages/rigid-ui/src", import.meta.url));

export default defineConfig({
  plugins: lazyPlugins(() => [solidPlugin()]),
  resolve: {
    alias: {
      "rigid-ui/scroll-area": `${librarySrc}/scroll-area/index.ts`,
      "rigid-ui/popover": `${librarySrc}/popover/index.ts`,
    },
  },
  base: process.env.GITHUB_ACTIONS ? "/rigid-ui/" : "/",
  server: {
    port: 3333,
  },
});
