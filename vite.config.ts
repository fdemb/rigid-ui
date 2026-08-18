import { defineConfig } from "vite-plus";

export default defineConfig({
  defaultPackage: {
    dev: "./apps/demo",
    build: "./apps/demo",
    preview: "./apps/demo",
    pack: "./packages/rigid-ui",
  },
  fmt: {
    ignorePatterns: ["reference/**", "**/dist/**"],
  },
  lint: {
    ignorePatterns: ["reference/**", "**/dist/**"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
  },
  test: {
    projects: ["./packages/rigid-ui"],
  },
  staged: {
    "*.{js,ts,tsx,css,json,md}": "vp check --fix",
  },
  run: {
    cache: true,
  },
});
