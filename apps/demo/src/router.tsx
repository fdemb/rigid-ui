import { lazy } from "solid-js";
import { createRouter } from "@solidjs/router";

export const Router = createRouter({
  // `BASE_URL` is "/" locally and "/rigid-ui/" in CI, matching the Pages project site.
  base: import.meta.env.BASE_URL,
  routes: [
    { path: "/", component: lazy(() => import("./pages/Home")) },
    { path: "/dialog", component: lazy(() => import("./pages/DialogPage")) },
    { path: "/alert-dialog", component: lazy(() => import("./pages/AlertDialogPage")) },
    { path: "/popover", component: lazy(() => import("./pages/PopoverPage")) },
    { path: "/tooltip", component: lazy(() => import("./pages/TooltipPage")) },
    { path: "/scroll-area", component: lazy(() => import("./pages/ScrollAreaPage")) },
    { path: "*404", component: lazy(() => import("./pages/NotFound")) },
  ],
});
