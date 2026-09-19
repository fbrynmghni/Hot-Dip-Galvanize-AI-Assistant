"use client";

import { useState } from "react";
import { ResultView } from "./result-view";
import { MATERIAL_CATEGORIES } from "@/lib/tools/coating-thickness/schema";

async function callTool(name: string, body: unknown) {
  try {
    const res = await fetch(`/api/tools/${name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return { ok: res.ok, data };
  } catch {
    return {
      ok: false,
      data: { error: "network_error", detail: "Tidak bisa menghubungi server." },
    };
  }
}

function Section({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className="panel-riveted p-5">
      <div className="mb-3 h-[2px] w-8 bg-kettle-red-bright" />
      <h2
        className="text-lg font-semibold uppercase tracking-wide text-steel-100"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h2>
      <p className="stamp-label mb-4 mt-1 normal-case tracking-normal">{subtitle}</p>
      {children}
    </section>
  );
}

function inputClass() {
  return "rounded-md border border-panel-border bg-panel px-3 py-1.5 text-sm text-steel-100";
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
          className="btn-forge rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-40"
        >
          Hitung
        </button>
      </div>
      <ResultView kind="thickness" result={result} />
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
        <span className="text-sm self-center text-steel-300">µm</span>
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
          className="btn-forge rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-40"
        >
          Hitung
        </button>
      </div>
      <ResultView kind="durability" result={result} />
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
        <span className="text-sm self-center text-steel-300">%Si</span>
        <input className={`${inputClass()} w-24`} type="number" step="0.001" value={siPct} onChange={(e) => setSiPct(e.target.value)} />
        <span className="text-sm self-center text-steel-300">%P</span>
        <input className={`${inputClass()} w-24`} type="number" step="0.001" value={pPct} onChange={(e) => setPPct(e.target.value)} />
        <button
          onClick={submit}
          disabled={loading}
          className="btn-forge rounded-md px-3 py-1.5 text-sm font-medium disabled:opacity-40"
        >
          Hitung
        </button>
      </div>
      <ResultView kind="reactivity" result={result} />
    </Section>
  );
}

export default function ToolsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10 sm:px-10">
      <p className="stamp-label mb-2">CALC · ENGINEERING</p>
      <h1
        className="mb-2 text-2xl font-semibold uppercase tracking-wide text-steel-100"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Kalkulator
      </h1>
      <p className="mb-8 text-sm text-steel-300">
        Semua angka dihitung fungsi murni yang teruji (lihat skill{" "}
        <code className="font-mono text-steel-100">hdg-engineering-tool</code>), bukan ditebak model. Config standar masih{" "}
        <code className="font-mono text-hazard-yellow">unverified</code> — jangan pakai sebagai dasar keputusan inspeksi.
      </p>
      <div className="flex flex-col gap-5">
        <ThicknessForm />
        <DurabilityForm />
        <ReactivityForm />
      </div>
    </main>
  );
}
