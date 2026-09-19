export default function LearnIndexPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 sm:px-10">
      <p className="stamp-label mb-2">HUB · REFERENCE</p>
      <h1
        className="mb-2 text-2xl font-semibold uppercase tracking-wide text-steel-100"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Knowledge hub
      </h1>
      <div className="panel-riveted mt-6 border-l-4 border-l-steel-400 p-5 text-sm text-steel-300">
        Belum ada artikel. Struktur halaman ada di{" "}
        <code className="font-mono text-steel-100">
          hdg-content-writer/references/site-map.md
        </code>{" "}
        — penulisan konten direncanakan Fase 1.
      </div>
    </main>
  );
}
