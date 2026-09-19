import Link from "next/link";

const NAV = [
  { href: "/chat", label: "Chat" },
  { href: "/tools", label: "Kalkulator" },
  { href: "/learn", label: "Knowledge Hub" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-10 bg-steel-950/95 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4 sm:px-10">
        <Link href="/" className="group flex items-baseline gap-2">
          <span
            className="text-lg font-semibold uppercase tracking-wide text-steel-100"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Galva<span className="temper-text">AI</span>
          </span>
          <span className="stamp-label hidden sm:inline">HDG assistant</span>
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded px-3 py-1.5 text-sm text-steel-300 transition-colors hover:bg-steel-900 hover:text-steel-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="temper-bar" />
    </header>
  );
}
