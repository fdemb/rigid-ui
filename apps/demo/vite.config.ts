import solidPlugin from "@solidjs/vite-plugin";
import { defineConfig, lazyPlugins } from "vite-plus";

export default defineConfig({
  plugins: lazyPlugins(() => [solidPlugin()]),
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
