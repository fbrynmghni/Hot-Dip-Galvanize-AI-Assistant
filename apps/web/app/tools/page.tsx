const tools = [
  { name: "Coating thickness", standard: "ASTM A123 / ISO 1461 / AS-NZS 4680" },
  { name: "Durability estimate", standard: "ISO 9223 corrosivity category" },
  { name: "Steel reactivity", standard: "Silicon/phosphorus content" },
];

export default function ToolsPage() {
  return (
    <main className="min-h-screen p-8 sm:p-20 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Kalkulator</h1>
      <p className="text-sm text-gray-500 mb-6">
        Belum diimplementasikan. Logika deterministik ada di rencana Fase 1 —
        lihat skill <code>hdg-engineering-tool</code> dan{" "}
        <code>packages/engineering-config</code>.
      </p>
      <ul className="flex flex-col gap-3">
        {tools.map((tool) => (
          <li key={tool.name} className="rounded-lg border border-black/10 dark:border-white/15 px-4 py-3">
            <div className="font-medium">{tool.name}</div>
            <div className="text-sm text-gray-500">{tool.standard}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
