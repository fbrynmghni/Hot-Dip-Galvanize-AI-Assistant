"use client";

import { useState } from "react";

const MATERIAL_CATEGORIES = [
  "STRUCTURAL_SHAPES",
  "STRIP_BAR",
  "PLATE",
  "PIPE_TUBING",
  "WIRE",
  "REINFORCING_BAR",
  "FORGINGS_CASTINGS",
] as const;

async function callTool(name: string, body: unknown) {
  const res = await fetch(`/api/tools/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { ok: res.ok, data };
}

function ResultCard({ result }: { result: { ok: boolean; data: unknown } | null }) {
  if (!result) return null;
  return (
    <pre
      className={`mt-3 rounded-md p-3 text-xs overflow-x-auto ${
        result.ok
          ? "bg-black/[.03] dark:bg-white/[.05]"
          : "bg-red-500/10 text-red-600 dark:text-red-400"
      }`}
    >
      {JSON.stringify(result.data, null, 2)}
    </pre>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-black/10 dark:border-white/15 p-4">
      <h2 className="font-medium">{title}</h2>
      <p className="text-sm text-gray-500 mb-3">{subtitle}</p>
      {children}
    </section>
  );
}

function inputClass() {
  return "rounded-md border border-black/10 dark:border-white/15 bg-transparent px-3 py-1.5 text-sm";
}

function ThicknessForm() {
  const [standard, setStandard] = useState<"ASTM_A123" | "ISO1461" | "ASNZS4680">("ASTM_A123");
  const [materialCategory, setMaterialCategory] = useState<(typeof MATERIAL_CATEGORIES)[number]>("PLATE");
  const [unit, setUnit] = useState<"mm" | "in">("mm");
  const [thickness, setThickness] = useState("10");
  const [isCasting, setIsCasting] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; data: unknown } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    const body =
      standard === "ASTM_A123"
        ? { standard, materialCategory, steelThickness: Number(thickness), unit }
        : { standard, steelThicknessMm: Number(thickness), isCasting };
    setResult(await callTool("check_coating_thickness", body));
    setLoading(false);
  }

  return (
    <Section title="Coating thickness" subtitle="ASTM A123 / ISO 1461 / AS-NZS 4680">
      <div className="flex flex-wrap gap-2 mb-2">
        <select className={inputClass()} value={standard} onChange={(e) => setStandard(e.target.value as typeof standard)}>
          <option value="ASTM_A123">ASTM A123</option>
          <option value="ISO1461">ISO 1461</option>
          <option value="ASNZS4680">AS/NZS 4680</option>
        </select>
        {standard === "ASTM_A123" && (
          <select
            className={inputClass()}
            value={materialCategory}
            onChange={(e) => setMaterialCategory(e.target.value as typeof materialCategory)}
          >
            {MATERIAL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replaceAll("_", " ").toLowerCase()}
              </option>
            ))}
          </select>
        )}
        <input
          className={`${inputClass()} w-24`}
          type="number"
          value={thickness}
          onChange={(e) => setThickness(e.target.value)}
        />
        {standard === "ASTM_A123" ? (
          <select className={inputClass()} value={unit} onChange={(e) => setUnit(e.target.value as "mm" | "in")}>
            <option value="mm">mm</option>
            <option value="in">in</option>
          </select>
        ) : (
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={isCasting} onChange={(e) => setIsCasting(e.target.checked)} />
            casting
          </label>
        )}
        <button
          onClick={submit}
          disabled={loading}
          className="rounded-md bg-foreground text-background px-3 py-1.5 text-sm font-medium disabled:opacity-40"
        >
          Hitung
        </button>
      </div>
      <ResultCard result={result} />
    </Section>
  );
}

function DurabilityForm() {
  const [coatingUm, setCoatingUm] = useState("80");
  const [category, setCategory] = useState<"C1" | "C2" | "C3" | "C4" | "C5" | "CX">("C3");
  const [result, setResult] = useState<{ ok: boolean; data: unknown } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setResult(await callTool("estimate_durability", { coatingUm: Number(coatingUm), category }));
    setLoading(false);
  }

  return (
    <Section title="Durability estimate" subtitle="ISO 9223 corrosivity category">
      <div className="flex flex-wrap gap-2 mb-2">
        <input
          className={`${inputClass()} w-28`}
          type="number"
          value={coatingUm}
          onChange={(e) => setCoatingUm(e.target.value)}
        />
        <span className="text-sm self-center text-gray-500">µm</span>
        <select className={inputClass()} value={category} onChange={(e) => setCategory(e.target.value as typeof category)}>
          {(["C1", "C2", "C3", "C4", "C5", "CX"] as const).map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <button
          onClick={submit}
          disabled={loading}
          className="rounded-md bg-foreground text-background px-3 py-1.5 text-sm font-medium disabled:opacity-40"
        >
          Hitung
        </button>
      </div>
      <ResultCard result={result} />
    </Section>
  );
}

function ReactivityForm() {
  const [siPct, setSiPct] = useState("0.02");
  const [pPct, setPPct] = useState("0");
  const [result, setResult] = useState<{ ok: boolean; data: unknown } | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setResult(await callTool("screen_steel_reactivity", { siPct: Number(siPct), pPct: Number(pPct) }));
    setLoading(false);
  }

  return (
    <Section title="Steel reactivity" subtitle="Silicon/phosphorus content (Sandelin)">
      <div className="flex flex-wrap gap-2 mb-2">
        <span className="text-sm self-center text-gray-500">%Si</span>
        <input className={`${inputClass()} w-24`} type="number" step="0.001" value={siPct} onChange={(e) => setSiPct(e.target.value)} />
        <span className="text-sm self-center text-gray-500">%P</span>
        <input className={`${inputClass()} w-24`} type="number" step="0.001" value={pPct} onChange={(e) => setPPct(e.target.value)} />
        <button
          onClick={submit}
          disabled={loading}
          className="rounded-md bg-foreground text-background px-3 py-1.5 text-sm font-medium disabled:opacity-40"
        >
          Hitung
        </button>
      </div>
      <ResultCard result={result} />
    </Section>
  );
}

export default function ToolsPage() {
  return (
    <main className="min-h-screen p-8 sm:p-20 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Kalkulator</h1>
      <p className="text-sm text-gray-500 mb-6">
        Semua angka dihitung fungsi murni yang teruji (lihat skill{" "}
        <code>hdg-engineering-tool</code>), bukan ditebak model. Config standar masih{" "}
        <code>unverified</code> — jangan pakai sebagai dasar keputusan inspeksi.
      </p>
      <div className="flex flex-col gap-4">
        <ThicknessForm />
        <DurabilityForm />
        <ReactivityForm />
      </div>
    </main>
  );
}
