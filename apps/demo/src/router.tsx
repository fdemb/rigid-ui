import { lazy } from "solid-js";
import { createRouter } from "@solidjs/router";
import DocsLayout from "./layouts/DocsLayout";
import SitePageLayout from "./layouts/SitePageLayout";

export const Router = createRouter({
  base: import.meta.env.BASE_URL.replace(/\/$/, ""),
  routes: [
    {
      path: "/",
      component: SitePageLayout,
      children: [
        { path: "/", component: lazy(() => import("./pages/Home")) },
        { path: "*404", component: lazy(() => import("./pages/NotFound")) },
      ],
    },
    {
      path: "/docs",
      component: DocsLayout,
      children: [{ path: "/", component: lazy(() => import("./docs/introduction.mdx")) }],
    },
    {
      path: "/elements",
      component: DocsLayout,
      children: [{ path: "/", component: lazy(() => import("./docs/components.mdx")) }],
    },
    {
      path: "/components",
      component: DocsLayout,
      children: [
        { path: "/", component: lazy(() => import("./docs/components.mdx")) },
        { path: "/button", component: lazy(() => import("./docs/components/button.mdx")) },
        { path: "/input", component: lazy(() => import("./docs/components/input.mdx")) },
        { path: "/label", component: lazy(() => import("./docs/components/label.mdx")) },
        { path: "/textarea", component: lazy(() => import("./docs/components/textarea.mdx")) },
        { path: "/badge", component: lazy(() => import("./docs/components/badge.mdx")) },
        { path: "/card", component: lazy(() => import("./docs/components/card.mdx")) },
        { path: "/separator", component: lazy(() => import("./docs/components/separator.mdx")) },
        { path: "/skeleton", component: lazy(() => import("./docs/components/skeleton.mdx")) },
        { path: "/dialog", component: lazy(() => import("./docs/components/dialog.mdx")) },
        {
          path: "/alert-dialog",
          component: lazy(() => import("./docs/components/alert-dialog.mdx")),
        },
        { path: "/popover", component: lazy(() => import("./docs/components/popover.mdx")) },
        { path: "/tooltip", component: lazy(() => import("./docs/components/tooltip.mdx")) },
        {
          path: "/scroll-area",
          component: lazy(() => import("./docs/components/scroll-area.mdx")),
        },
      ],
    },
    {
      path: "/primitives",
      component: DocsLayout,
      children: [
        { path: "/", component: lazy(() => import("./docs/primitives.mdx")) },
        { path: "/separator", component: lazy(() => import("./docs/primitives/separator.mdx")) },
        { path: "/dialog", component: lazy(() => import("./docs/primitives/dialog.mdx")) },
        {
          path: "/alert-dialog",
          component: lazy(() => import("./docs/primitives/alert-dialog.mdx")),
        },
        { path: "/popover", component: lazy(() => import("./docs/primitives/popover.mdx")) },
        { path: "/tooltip", component: lazy(() => import("./docs/primitives/tooltip.mdx")) },
        {
          path: "/scroll-area",
          component: lazy(() => import("./docs/primitives/scroll-area.mdx")),
        },
      ],
    },
  ],
});
