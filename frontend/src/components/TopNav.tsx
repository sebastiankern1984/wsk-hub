import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
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
  { to: "/products", label: "Produkte", icon: Package },
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
  {
    label: "Einstellungen",
    icon: Settings2,
    prefix: "/settings",
    children: [
      { to: "/events", label: "Events", icon: Activity },
      { to: "/settings", label: "Einstellungen", icon: Settings2 },
    ],
  },
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

  const enter = () => {
    if (timeout.current) clearTimeout(timeout.current);
    setOpen(true);
  };
  const leave = () => {
    timeout.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(
    () => () => {
      if (timeout.current) clearTimeout(timeout.current);
    },
    []
  );

  return (
    <div className="relative" onMouseEnter={enter} onMouseLeave={leave}>
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
    const isActive =
      location.pathname.startsWith(entry.prefix) ||
      entry.children.some((c) => location.pathname.startsWith(c.to));
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

/* ── Vertical Ticker ── */
function VerticalTicker({ items }: { items: string[] }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const interval = setInterval(() => {
      setIdx((prev) => (prev + 1) % items.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [items.length]);

  const prevIdx = (idx - 1 + items.length) % items.length;

  return (
    <div className="relative h-4 w-44 overflow-hidden">
      {items.map((item, i) => (
        <div
          key={i}
          className={cn(
            "absolute inset-0 flex items-center font-mono text-[11px] text-muted-foreground transition-all duration-600 ease-in-out",
            i === idx && "translate-y-0 opacity-100",
            i === prevIdx && "translate-y-full opacity-0",
            i !== idx && i !== prevIdx && "-translate-y-full opacity-0"
          )}
        >
          {item}
        </div>
      ))}
    </div>
  );
}

/* ── Language Dropdown ── */
const LANGUAGES = [
  { code: "de", flag: "\u{1F1E9}\u{1F1EA}", label: "Deutsch" },
  { code: "en", flag: "\u{1F1EC}\u{1F1E7}", label: "English" },
  { code: "kr", flag: "\u{1F1F0}\u{1F1F7}", label: "\uD55C\uAD6D\uC5B4" },
];

function LanguageDropdown() {
  const [open, setOpen] = useState(false);
  const [lang, setLang] = useState("de");
  const ref = useRef<HTMLDivElement>(null);
  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <span className="text-sm">{current.flag}</span>
        <ChevronDown className="h-2.5 w-2.5" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[130px] rounded-lg border border-border bg-card py-1 shadow-lg">
          {LANGUAGES.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors hover:bg-accent",
                l.code === lang
                  ? "text-primary"
                  : "text-muted-foreground"
              )}
            >
              <span className="text-sm">{l.flag}</span>
              {l.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Ticker Bar (top row) ── */
function TickerBar() {
  const [rates, setRates] = useState<{
    eurKrw: number;
    usdKrw: number;
  } | null>(null);
  const [time, setTime] = useState(new Date());

  // Fetch exchange rates
  useEffect(() => {
    const fetchRates = () => {
      fetch("https://api.frankfurter.dev/v1/latest?base=EUR&symbols=KRW,USD")
        .then((r) => r.json())
        .then((data) => {
          if (data.rates) {
            setRates({
              eurKrw: data.rates.KRW,
              usdKrw: data.rates.KRW / data.rates.USD,
            });
          }
        })
        .catch(() => {});
    };
    fetchRates();
    const interval = setInterval(fetchRates, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Update clock every second
  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const fmt = (tz: string) =>
    time.toLocaleTimeString("de-DE", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
    });

  const fmtNum = (n: number) =>
    n.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const tickerItems = rates
    ? [
        `\u20A9/\u20AC  ${fmtNum(rates.eurKrw)}`,
        `\u20AC/\u20A9  ${(1 / rates.eurKrw).toFixed(6)}`,
        `\u20A9/$  ${fmtNum(rates.usdKrw)}`,
        `\u{1F1E9}\u{1F1EA} ${fmt("Europe/Berlin")}`,
        `\u{1F1F0}\u{1F1F7} ${fmt("Asia/Seoul")}`,
      ]
    : [
        "\u20A9/\u20AC  ...",
        "\u20AC/\u20A9  ...",
        "\u20A9/$  ...",
        `\u{1F1E9}\u{1F1EA} ${fmt("Europe/Berlin")}`,
        `\u{1F1F0}\u{1F1F7} ${fmt("Asia/Seoul")}`,
      ];

  return (
    <div className="border-b border-border/50 bg-background/60">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-7 items-center justify-between">
          {/* Left: cycling ticker */}
          <VerticalTicker items={tickerItems} />

          {/* Right: clocks + language */}
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-muted-foreground">
              {"\u{1F1E9}\u{1F1EA}"} {fmt("Europe/Berlin")}
            </span>
            <span className="font-mono text-[11px] text-muted-foreground">
              {"\u{1F1F0}\u{1F1F7}"} {fmt("Asia/Seoul")}
            </span>
            <LanguageDropdown />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── TopNav ── */
export function TopNav() {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-card">
      {/* Ticker bar */}
      <TickerBar />

      {/* Main nav */}
      <div className="border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center">
            <Link to="/" className="mr-8 flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Database className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-bold text-foreground">
                WSK Hub
              </span>
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
      </div>
    </header>
  );
}
