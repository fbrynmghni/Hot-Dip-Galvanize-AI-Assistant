import Link from "next/link";

const modules = [
  {
    href: "/chat",
    tag: "RAG · CHAT",
    accent: "var(--zinc-blue-bright)",
    label: "Chat",
    desc: "Tanya jawab HDG dengan sitasi AGA/GAA — angka selalu dihitung tool, bukan ditebak model.",
  },
  {
    href: "/tools",
    tag: "CALC · ENGINEERING",
    accent: "var(--kettle-red-bright)",
    label: "Kalkulator",
    desc: "Thickness, durability, reactivity — fungsi murni yang teruji di titik batas standar.",
  },
  {
    href: "/learn",
    tag: "HUB · REFERENCE",
    accent: "var(--steel-400)",
    label: "Knowledge hub",
    desc: "Artikel, glosarium, dan tabel standar — masih dalam pengerjaan.",
  },
];

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <section className="blueprint-grid relative overflow-hidden border-b border-panel-border">
        <div
          className="pointer-events-none absolute inset-0"
          style={{ backgroundImage: "var(--temper-gradient-radial)" }}
        />
        <div className="relative mx-auto max-w-4xl px-6 py-20 sm:px-10 sm:py-28">
          <p className="stamp-label mb-4">Batch / after-fabrication hot dip galvanizing</p>
          <h1
            className="max-w-2xl text-4xl font-semibold uppercase leading-tight tracking-tight text-steel-100 sm:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Dari baja dingin ke <span className="temper-text">seng cair panas</span>, dijawab dengan sitasi.
          </h1>
          <p className="mt-6 max-w-xl text-base text-steel-300">
            Knowledge hub dan AI assistant untuk hot dip galvanizing. Chat dan
            kalkulator sudah bisa dicoba — knowledge hub masih dalam
            pengerjaan. Sumber utama: AGA dan GAA.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-4xl flex-1 px-6 py-14 sm:px-10">
        <div className="grid gap-5 sm:grid-cols-3">
          {modules.map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className="panel-riveted group flex flex-col p-5 transition-colors hover:border-steel-400"
            >
              <span
                className="stamp-label mb-4"
                style={{ color: m.accent }}
              >
                {m.tag}
              </span>
              <h2
                className="text-xl font-semibold uppercase tracking-wide text-steel-100"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {m.label}
              </h2>
              <p className="mt-2 flex-1 text-sm text-steel-300">{m.desc}</p>
              <span
                className="mt-4 h-[2px] w-8 transition-all group-hover:w-full"
                style={{ backgroundColor: m.accent }}
              />
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
