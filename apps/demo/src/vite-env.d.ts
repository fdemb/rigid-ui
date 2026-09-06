/// <reference types="vite-plus/client" />

declare module "*.mdx" {
  import type { Component } from "solid-js";
  const content: Component;
  export default content;
}
