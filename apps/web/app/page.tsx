import Link from "next/link";

const links = [
  { href: "/chat", label: "Chat", desc: "Tanya jawab HDG dengan sitasi AGA/GAA" },
  { href: "/tools", label: "Kalkulator", desc: "Thickness, durability, reactivity" },
  { href: "/learn", label: "Knowledge hub", desc: "Artikel, glosarium, standar" },
];

export default function Home() {
  return (
    <main className="min-h-screen p-8 sm:p-20 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">GalvaAI</h1>
      <p className="text-sm text-gray-500 mb-10">
        Knowledge hub + AI assistant untuk hot dip galvanizing (batch /
        after-fabrication). Chat dan kalkulator sudah bisa dicoba — knowledge
        hub masih dalam pengerjaan.
      </p>
      <nav className="flex flex-col gap-4">
        {links.map(({ href, label, desc }) => (
          <Link
            key={href}
            href={href}
            className="rounded-lg border border-black/10 dark:border-white/15 px-4 py-3 hover:border-black/30 dark:hover:border-white/40 transition-colors"
          >
            <div className="font-medium">{label}</div>
            <div className="text-sm text-gray-500">{desc}</div>
          </Link>
        ))}
      </nav>
    </main>
  );
}
