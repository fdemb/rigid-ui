import { lazy } from "solid-js";
import { createRouter } from "@solidjs/router";

export const Router = createRouter({
  // `BASE_URL` is "/" locally and "/rigid-ui/" in CI, matching the Pages project
  // site. The router joins base and path with a separator of its own and only
  // trims repeated trailing slashes, so the trailing one has to go here or every
  // link resolves to "/rigid-ui//dialog".
  base: import.meta.env.BASE_URL.replace(/\/$/, ""),
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
