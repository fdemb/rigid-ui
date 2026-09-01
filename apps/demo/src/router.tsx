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
    { path: "/elements", component: lazy(() => import("./pages/ComponentsPage")) },
    { path: "/components", component: lazy(() => import("./pages/ComponentsPage")) },
    { path: "/components/button", component: lazy(() => import("./pages/ButtonPage")) },
    { path: "/components/input", component: lazy(() => import("./pages/InputPage")) },
    { path: "/components/label", component: lazy(() => import("./pages/LabelPage")) },
    { path: "/components/textarea", component: lazy(() => import("./pages/TextareaPage")) },
    { path: "/components/dialog", component: lazy(() => import("./pages/DialogPage")) },
    {
      path: "/components/alert-dialog",
      component: lazy(() => import("./pages/AlertDialogPage")),
    },
    { path: "/components/popover", component: lazy(() => import("./pages/PopoverPage")) },
    { path: "/components/tooltip", component: lazy(() => import("./pages/TooltipPage")) },
    {
      path: "/components/scroll-area",
      component: lazy(() => import("./pages/ScrollAreaPage")),
    },
    { path: "/components/card", component: lazy(() => import("./pages/CardPage")) },
    { path: "/components/separator", component: lazy(() => import("./pages/SeparatorPage")) },
    { path: "/components/badge", component: lazy(() => import("./pages/BadgePage")) },
    { path: "/components/skeleton", component: lazy(() => import("./pages/SkeletonPage")) },
    { path: "/primitives", component: lazy(() => import("./pages/PrimitivesPage")) },
    { path: "/primitives/:primitive", component: lazy(() => import("./pages/PrimitivePage")) },
    { path: "*404", component: lazy(() => import("./pages/NotFound")) },
  ],
});
