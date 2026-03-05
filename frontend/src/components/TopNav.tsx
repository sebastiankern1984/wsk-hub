import { useState, useRef, useEffect } from "react";
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
  Settings2,
  ChevronDown,
  Cable,
} from "lucide-react";

type NavLink = { to: string; label: string; icon: React.ElementType };
type NavDropdown = {
  label: string;
  icon: React.ElementType;
  prefix: string;
  children: NavLink[];
};
type NavEntry = NavLink | NavDropdown;

function isDropdown(entry: NavEntry): entry is NavDropdown {
  return "children" in entry;
}

const navEntries: NavEntry[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/products", label: "Produkte", icon: Package },
  { to: "/events", label: "Events", icon: Activity },
  {
    label: "Connectoren",
    icon: Cable,
    prefix: "/connectors",
    children: [
      { to: "/connectors/abda", label: "ABDA", icon: FileSpreadsheet },
      { to: "/connectors/suppliers", label: "Lieferanten", icon: Truck },
    ],
  },
];

const adminEntries: NavEntry[] = [
  { to: "/settings", label: "Einstellungen", icon: Settings2 },
];

/* ── Dropdown component ── */
function NavDropdownMenu({
  entry,
  isActive,
}: {
  entry: NavDropdown;
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  const enter = () => {
    if (timeout.current) clearTimeout(timeout.current);
    setOpen(true);
  };
  const leave = () => {
    timeout.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={enter}
      onMouseLeave={leave}
    >
      <button
        className={cn(
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-accent hover:text-foreground"
        )}
      >
        <entry.icon className="h-4 w-4" />
        {entry.label}
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[180px] rounded-lg border border-border bg-card py-1 shadow-lg">
          {entry.children.map((child) => (
            <Link
              key={child.to}
              to={child.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <child.icon className="h-4 w-4" />
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── NavItem renderer ── */
function NavItem({ entry }: { entry: NavEntry }) {
  const location = useLocation();

  if (isDropdown(entry)) {
    const isActive = location.pathname.startsWith(entry.prefix);
    return <NavDropdownMenu entry={entry} isActive={isActive} />;
  }

  const isActive =
    entry.to === "/"
      ? location.pathname === "/"
      : location.pathname.startsWith(entry.to);

  return (
    <Link
      to={entry.to}
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent hover:text-foreground"
      )}
    >
      <entry.icon className="h-4 w-4" />
      {entry.label}
    </Link>
  );
}

/* ── TopNav ── */
export function TopNav() {
  const { user, logout } = useAuth();

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
            {navEntries.map((entry) => (
              <NavItem
                key={isDropdown(entry) ? entry.prefix : entry.to}
                entry={entry}
              />
            ))}
            {user?.role === "admin" &&
              adminEntries.map((entry) => (
                <NavItem
                  key={isDropdown(entry) ? entry.prefix : entry.to}
                  entry={entry}
                />
              ))}
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
