"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, LogOut, Search, ShieldCheck, Stethoscope, Users } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useLogout, useMe } from "@/hooks/queries";
import { initials } from "@/lib/format";
import { BrandMark } from "./brand";
import { ThemeToggle } from "./theme-toggle";
import { NavPending } from "./nav-pending";
import dynamic from "next/dynamic";
import { Kbd, useCommandShortcut } from "./kbd";

// Loaded on first open, not with every page.
const CommandPalette = dynamic(() => import("./command-palette").then((m) => m.CommandPalette), { ssr: false });

const NAV = [
  { href: "/", label: "Overview", icon: LayoutGrid },
  { href: "/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/patients", label: "Patients", icon: Users },
];

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

export function AppShell({ children }: { children: ReactNode }) {
  const path = usePathname();
  const { data: me } = useMe();
  const logout = useLogout();
  const [searching, setSearching] = useState(false);
  useCommandShortcut(useCallback(() => setSearching(true), []));

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[232px_1fr]">
      <a href="#main" className="sr-only z-50 rounded bg-surface px-3 py-2 focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh flex-col border-r border-line bg-surface lg:flex">
        <Link href="/" className="flex items-center gap-2.5 px-5 pt-5 pb-6">
          <BrandMark />
          <span className="text-md font-semibold tracking-tight">Doctor Tracker</span>
        </Link>
        <button
          onClick={() => setSearching(true)}
          className="mx-3 mb-4 flex h-9 items-center gap-2 rounded-lg border border-line bg-surface-2 px-3 text-left text-sm text-faint hover:border-line-strong hover:text-muted"
        >
          <Search size={15} />
          <span className="flex-1">Search</span>
          <Kbd>Ctrl K</Kbd>
        </button>
        <nav aria-label="Main" className="flex flex-col gap-0.5 px-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const on = isActive(path, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "relative flex items-center gap-3 rounded-lg px-3 py-2 text-base",
                  on ? "bg-pine-soft font-medium text-ink" : "text-muted hover:bg-surface-2 hover:text-ink",
                )}
              >
                {on && <span aria-hidden className="absolute top-2 bottom-2 -left-3 w-[3px] rounded-r bg-pine" />}
                <Icon size={18} strokeWidth={on ? 2.2 : 1.8} />
                {label}
                <NavPending />
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex flex-col gap-3 border-t border-line p-3">
          {me?.role === "admin" && (
            <Link
              href="/admins"
              aria-current={isActive(path, "/admins") ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-base",
                isActive(path, "/admins") ? "bg-pine-soft font-medium text-ink" : "text-muted hover:bg-surface-2 hover:text-ink",
              )}
            >
              <ShieldCheck size={18} strokeWidth={isActive(path, "/admins") ? 2.2 : 1.8} />
              Admin Suite
            </Link>
          )}
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/60 p-2.5">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-pine-soft text-xs font-semibold text-pine">
              {me ? initials(me.name) : ""}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium leading-tight">{me?.name ?? " "}</p>
              <p className="truncate text-xs leading-tight text-muted" title={me?.email}>
                {me?.email ?? " "}
              </p>
              {me?.role === "viewer" && (
                <span className="mt-1 inline-block rounded bg-surface px-1.5 py-0.5 text-xs text-muted" title="You can browse everything but not make changes">
                  View only
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 px-1">
            <button
              onClick={() => logout.mutate()}
              disabled={logout.isPending}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-muted hover:bg-surface-2 hover:text-ink"
            >
              <LogOut size={16} /> Sign Out
            </button>
            <ThemeToggle className="inline-flex size-8 items-center justify-center rounded-lg text-muted hover:bg-surface-2 hover:text-ink" />
          </div>
        </div>
      </aside>

      {/* Mobile: compact top bar plus a thumb-reachable tab bar. */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-surface px-4 lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <BrandMark size={24} />
          <span className="font-semibold">Doctor Tracker</span>
        </Link>
        <div className="flex items-center gap-1">
          <button onClick={() => setSearching(true)} aria-label="Search" className="inline-flex size-9 items-center justify-center rounded-lg text-muted">
            <Search size={18} />
          </button>
          {me?.role === "admin" && (
            <Link href="/admins" aria-label="Admin Suite" className="inline-flex size-9 items-center justify-center rounded-lg text-muted">
              <ShieldCheck size={18} />
            </Link>
          )}
          <ThemeToggle className="inline-flex size-9 items-center justify-center rounded-lg text-muted" />
          <button onClick={() => logout.mutate()} aria-label="Sign Out" className="inline-flex size-9 items-center justify-center rounded-lg text-muted">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <main id="main" className="min-w-0 px-4 pt-5 pb-28 sm:px-6 lg:px-10 lg:pt-8 lg:pb-12">
        <div className="mx-auto max-w-[1320px]">{children}</div>
      </main>

      {searching && <CommandPalette open onOpenChange={setSearching} />}

      <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        {NAV.map(({ href, label, icon: Icon }) => {
          const on = isActive(path, href);
          return (
            <Link key={href} href={href} aria-current={on ? "page" : undefined} className={cn("flex flex-col items-center gap-0.5 py-2.5 text-xs", on ? "font-medium text-pine" : "text-muted")}>
              <Icon size={20} strokeWidth={on ? 2.2 : 1.8} />
              {label}
              <NavPending />
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PageHeader({ title, info, actions, children }: { title: string; info?: ReactNode; actions?: ReactNode; children?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          {title}
          {info}
        </h1>
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
