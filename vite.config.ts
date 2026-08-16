import solid from "rolldown-plugin-solid";
import { defineConfig, lazyPlugins } from "vite-plus";
import solidPlugin from "vite-plugin-solid";

export default defineConfig({
  pack: {
    entry: {
      "scroll-area/index": "src/scroll-area/index.ts",
    },
    platform: "neutral",
    outDir: "dist",
    dts: true,
    clean: true,
    treeshake: true,
    plugins: [solid()],
  },
  fmt: {},
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  test: {
    passWithNoTests: true,
    environment: "node",
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "reference/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
  },
  plugins: lazyPlugins(() => [solidPlugin()]),
  base: process.env.GITHUB_ACTIONS ? "/rigid-ui/" : "/",
  server: {
    port: 3333,
  },
});
