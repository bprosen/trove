
import { Link, useLocation } from "@tanstack/react-router";
import {
  BarChart3,
  CalendarClock,
  FolderHeart,
  Gem,
  Library,
  Menu,
  PenLine,
  Settings,
  Sun,
  Tags,
  Trophy,
} from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const NAV = [
  { href: "/", label: "Today", icon: Sun },
  { href: "/library", label: "Library", icon: Library },
  { href: "/sessions", label: "Sessions", icon: CalendarClock },
  { href: "/stats", label: "Stats", icon: BarChart3 },
  { href: "/achievements", label: "Achievements", icon: Trophy },
  { href: "/collections", label: "Collections", icon: FolderHeart },
  { href: "/genres", label: "Genres", icon: Tags },
  { href: "/reviews", label: "Reviews", icon: PenLine },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

type NavHref = (typeof NAV)[number]["href"];

const MOBILE: readonly string[] = ["/", "/library", "/sessions", "/stats"];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/library") return pathname.startsWith("/library") || pathname.startsWith("/books");
  return pathname.startsWith(href);
}

export function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 font-heading text-xl font-semibold tracking-tight">
      <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
        <Gem className="size-4" />
      </span>
      trove
    </Link>
  );
}

function SidebarLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          to={href}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
            pathname && isActive(pathname, href) && "bg-accent font-medium text-foreground",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}

function MobileLinks({ pathname }: { pathname: string | null }) {
  const more = NAV.filter((n) => !MOBILE.includes(n.href));
  const moreActive = pathname != null && more.some((n) => isActive(pathname, n.href));
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {NAV.filter((n) => MOBILE.includes(n.href)).map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          to={href}
          className={cn(
            "flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground",
            pathname && isActive(pathname, href) && "text-primary",
          )}
        >
          <Icon className="size-5" />
          {label}
        </Link>
      ))}
      <Sheet>
        <SheetTrigger className={cn("flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground", moreActive && "text-primary")}>
          <Menu className="size-5" />
          More
        </SheetTrigger>
        <SheetContent side="bottom" className="pb-[calc(env(safe-area-inset-bottom)+1rem)]">
          <SheetHeader>
            <SheetTitle>More</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-3 gap-2 px-4">
            {more.map(({ href, label, icon: Icon }) => (
              <SheetCloseLink key={href} href={href} active={!!pathname && isActive(pathname, href)}>
                <Icon className="size-5" />
                {label}
              </SheetCloseLink>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}

function SheetCloseLink({ href, active, children }: { href: NavHref; active: boolean; children: React.ReactNode }) {
  return (
    <SheetClose asChild>
      <Link
        to={href}
        className={cn(
          "flex flex-col items-center gap-1.5 rounded-lg border p-3 text-xs text-muted-foreground hover:bg-accent",
          active && "border-primary text-primary",
        )}
      >
        {children}
      </Link>
    </SheetClose>
  );
}

export function SidebarNav() {
  return <SidebarLinks pathname={useLocation({ select: (l) => l.pathname })} />;
}

export function MobileNav() {
  return <MobileLinks pathname={useLocation({ select: (l) => l.pathname })} />;
}
