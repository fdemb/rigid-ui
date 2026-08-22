import { transform } from "@dom-expressions/compiler";
import solidPlugin from "@solidjs/vite-plugin";
import { defineConfig, lazyPlugins } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";

const testEnvironment = process.env.VITEST_ENV ?? "jsdom";
const browserMode = testEnvironment === "chromium";

const SOLID_BUILT_INS = [
  "For",
  "Show",
  "Switch",
  "Match",
  "Loading",
  "Reveal",
  "Portal",
  "Repeat",
  "Dynamic",
  "Errored",
];

function solidNative() {
  return {
    name: "solid-native",
    transform: {
      filter: { id: /\.[jt]sx$/ },
      handler(code: string, id: string) {
        const result = transform(code, {
          filename: id,
          moduleName: "@solidjs/web",
          generate: "dom",
          builtIns: SOLID_BUILT_INS,
          contextToCustomElements: true,
          wrapConditionals: true,
          sourceMap: true,
        });
        return { code: result.code, map: result.map };
      },
    },
  };
}

export default defineConfig({
  pack: {
    entry: {
      "scroll-area/index": "src/scroll-area/index.ts",
      "dialog/index": "src/dialog/index.ts",
      "popover/index": "src/popover/index.ts",
    },
    platform: "neutral",
    outDir: "dist",
    dts: true,
    clean: true,
    treeshake: true,
    plugins: [solidNative()],
  },
  test: {
    globals: true,
    setupFiles: ["./test/setupVitest.ts"],
    ...(browserMode ? {} : { environment: "jsdom" }),
    environmentOptions: {
      jsdom: {
        pretendToBeVisual: true,
        url: "http://localhost",
      },
    },
    browser: browserMode
      ? {
          enabled: true,
          provider: playwright(),
          headless: true,
          instances: [{ browser: "chromium" }],
        }
      : undefined,
    exclude: ["**/node_modules/**", "**/dist/**", "**/.{idea,git,cache,output,temp}/**"],
  },
  optimizeDeps: {
    include: ["vite-plus/test"],
  },
  plugins: lazyPlugins(() => [solidPlugin()]),
});
