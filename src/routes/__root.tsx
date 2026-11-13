import type { ReactNode } from "react";
import { HeadContent, Outlet, Scripts, createRootRoute } from "@tanstack/react-router";
import { Providers } from "@/components/providers";
import { Brand, MobileNav, SidebarNav } from "@/components/trove/nav";
import { ThemeToggle } from "@/components/trove/theme-toggle";
import { HeaderStats } from "@/components/trove/header-stats";
import { AchievementCelebration } from "@/components/trove/achievement-celebration";
import { getHeaderStats } from "@/lib/data";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Trove" },
      { name: "description", content: "Your personal book registry — track, rate, review, and level up your reading." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      // Empty inline icon: stops browsers from requesting /favicon.ico.
      { rel: "icon", href: "data:," },
    ],
  }),
  loader: () => getHeaderStats(),
  shellComponent: RootDocument,
  component: RootLayout,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <head>
        <HeadContent />
      </head>
      <body className="min-h-full">
        <Providers>{children}</Providers>
        <Scripts />
      </body>
    </html>
  );
}

function RootLayout() {
  const headerStats = Route.useLoaderData();
  return (
    <>
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col gap-6 border-r bg-sidebar p-4 md:flex">
          <div className="px-2 pt-1">
            <Brand />
          </div>
          <SidebarNav />
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b bg-background/90 px-4 backdrop-blur md:justify-end md:px-8">
            <div className="md:hidden">
              <Brand />
            </div>
            <div className="flex items-center gap-2">
              <HeaderStats stats={headerStats} />
              <ThemeToggle />
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24 md:px-8 md:pb-12">
            <Outlet />
          </main>
        </div>
      </div>
      <MobileNav />
      <AchievementCelebration newUnlocks={headerStats.newUnlocks} />
    </>
  );
}
