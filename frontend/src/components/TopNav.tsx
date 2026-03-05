import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Truck,
  Activity,
  LogOut,
  Database,
  FileSpreadsheet,
  Search,
  Settings2,
} from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Produkte", icon: Package },
  { to: "/suppliers", label: "Lieferanten", icon: Truck },
  { to: "/events", label: "Events", icon: Activity },
  { to: "/abda/import", label: "ABDA Import", icon: FileSpreadsheet },
  { to: "/abda/lookup", label: "ABDA Suche", icon: Search },
];

const adminNavItems = [
  { to: "/settings", label: "Einstellungen", icon: Settings2 },
];

export function TopNav() {
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center">
          <Link to="/" className="mr-8 flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Database className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-bold text-foreground">WSK Hub</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                item.to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            {user?.role === "admin" &&
              adminNavItems.map((item) => {
                const isActive = location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
          </nav>

          <div className="ml-auto flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              {user?.display_name}
              {user?.role && (
                <span className="ml-1.5 rounded bg-secondary px-1.5 py-0.5 text-[10px] uppercase">
                  {user.role}
                </span>
              )}
            </span>
            <button
              onClick={logout}
              className="text-muted-foreground transition-colors hover:text-foreground"
              title="Abmelden"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
