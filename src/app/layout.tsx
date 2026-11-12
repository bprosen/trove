import type { Metadata } from "next";
import { Suspense } from "react";
import { Providers } from "@/components/providers";
import { Brand, MobileNav, SidebarNav } from "@/components/trove/nav";
import { ThemeToggle } from "@/components/trove/theme-toggle";
import { HeaderStats, HeaderStatsFallback } from "@/components/trove/header-stats";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Trove", template: "%s · Trove" },
  description: "Your personal book registry — track, rate, review, and level up your reading.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full antialiased">
      <body className="min-h-full">
        <Providers>
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
                  <Suspense fallback={<HeaderStatsFallback />}>
                    <HeaderStats />
                  </Suspense>
                  <ThemeToggle />
                </div>
              </header>
              <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-24 md:px-8 md:pb-12">
                {children}
              </main>
            </div>
          </div>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
