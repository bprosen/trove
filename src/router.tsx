import { createRouter } from "@tanstack/react-router";
import { NotFound } from "@/components/trove/not-found";
import { PageSkeleton } from "@/components/trove/page-skeleton";
import { routeTree } from "./routeTree.gen";

export function getRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPendingComponent: PageSkeleton,
    defaultNotFoundComponent: NotFound,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
