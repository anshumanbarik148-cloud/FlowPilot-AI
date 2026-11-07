import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Briefcase,
  LayoutDashboard,
  ListChecks,
  Menu,
  Plug,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { apiGet } from "@/lib/api";
import type { Stats } from "@/types";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, testid: "sidebar-link-dashboard" },
  { to: "/assistant", label: "AI Assistant", icon: Sparkles, testid: "sidebar-link-assistant" },
  { to: "/creator", label: "Creator Studio", icon: Wand2, testid: "sidebar-link-creator" },
  { to: "/business", label: "Business Studio", icon: Briefcase, testid: "sidebar-link-business" },
  { to: "/workflows", label: "Workflows", icon: ListChecks, testid: "sidebar-link-workflows" },
  { to: "/integrations", label: "Integrations", icon: Plug, testid: "sidebar-link-integrations" },
];

function SidebarNav({ onNavigate, pending }: { onNavigate?: () => void; pending: number }) {
  return (
    <nav className="flex flex-col gap-1 px-3" data-testid="sidebar-nav">
      {NAV.map(({ to, label, icon: Icon, testid }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onNavigate}
          data-testid={testid}
          className={({ isActive }) =>
            cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
            )
          }
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1">{label}</span>
          {to === "/workflows" && pending > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[11px]" data-testid="sidebar-pending-badge">
              {pending}
            </Badge>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <Link to="/dashboard" className="flex items-center gap-2.5 px-5 py-5" data-testid="sidebar-brand">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Zap className="h-4 w-4" />
      </span>
      <span className="font-heading text-lg font-semibold tracking-tight">FlowPilot AI</span>
    </Link>
  );
}

export default function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  // Refetch lightly so the pending badge tracks task changes made in other tabs.
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiGet<Stats>("/stats"),
    refetchInterval: 30000,
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside
        className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar md:flex"
        data-testid="app-sidebar"
      >
        <Brand />
        <SidebarNav pending={stats?.pending ?? 0} />
        <div className="mt-auto flex items-center justify-between border-t border-sidebar-border px-4 py-3">
          <span className="text-xs text-muted-foreground">Shared workspace</span>
          <ThemeToggle />
        </div>
      </aside>

      <div className="md:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open navigation"
                data-testid="mobile-nav-open-btn"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <SheetContent side="left" className="w-72 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="flex h-full flex-col">
                  <Brand />
                  <SidebarNav pending={stats?.pending ?? 0} onNavigate={() => setMobileOpen(false)} />
                  <div className="mt-auto flex items-center justify-between border-t border-sidebar-border px-4 py-3">
                    <span className="text-xs text-muted-foreground">Shared workspace</span>
                    <ThemeToggle />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            <span className="font-heading font-semibold tracking-tight">FlowPilot AI</span>
          </div>
          <p className="hidden text-sm text-muted-foreground md:block">
            Your AI workspace for repetitive digital tasks
          </p>
          <div className="flex items-center gap-2">
            <Link
              to="/assistant"
              className={buttonVariants({ size: "sm" })}
              data-testid="topbar-new-plan-link"
            >
              <Sparkles className="h-4 w-4" />
              New plan
            </Link>
            <div className="md:hidden">
              <ThemeToggle />
            </div>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 md:py-8 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
