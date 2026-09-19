import { formatErrorDetail } from "@/lib/format-error-detail";

type Verdict = "CONFORMS" | "NON_CONFORMING" | "NEEDS_MANUAL_REVIEW" | "NOT_DEFINED";
type CheckValue = "PASS" | "FAIL" | "NOT_CHECKED";

interface ThicknessResult {
  standard?: string;
  materialCategory?: string;
  thicknessRange?: string;
  verdict?: Verdict;
  note?: string;
  maxThickness?: string;
  unverified?: boolean;
  requirement?: {
    averageMinUm?: number;
    averageMinMils?: number;
    individualSpecimenMinUm?: number | null;
    localMinUm?: number;
    meanMinUm?: number;
  };
  measured?: {
    specimenAveragesUm?: number[];
    lotAverageUm?: number;
    localThicknessesUm?: number[];
    meanUm?: number;
  };
  checks?: Record<string, CheckValue>;
  failingSpecimens?: { specimen: number; avgUm: number }[];
  failingAreas?: { area: number; localUm: number }[];
}

interface DurabilityResult {
  category?: string;
  yearsRange?: { worst: number; best: number | string };
  method?: string;
  recommend?: string;
  unverified?: boolean;
}

interface ReactivityResult {
  siEquivalent?: number;
  zone?: string;
  expectation?: string;
  disclaimer?: string;
  unverified?: boolean;
}

const BADGE_ACCENT: Record<string, string> = {
  CONFORMS: "var(--zinc-blue-bright)",
  PASS: "var(--zinc-blue-bright)",
  NON_CONFORMING: "var(--kettle-red-bright)",
  FAIL: "var(--kettle-red-bright)",
  NEEDS_MANUAL_REVIEW: "var(--hazard-yellow)",
  NOT_CHECKED: "var(--hazard-yellow)",
  NOT_DEFINED: "var(--steel-400)",
  LOW: "var(--zinc-blue-bright)",
  MODERATE: "var(--steel-300)",
  SANDELIN: "var(--kettle-red-bright)",
  HIGH: "var(--hazard-yellow)",
};

const CHECK_LABELS: Record<string, string> = {
  lotAverage: "Rata-rata lot",
  individualSpecimens: "Spesimen individual",
  local: "Lokal",
  mean: "Rata-rata",
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function formatLabel(key: string) {
  return CHECK_LABELS[key] ?? key.replace(/([A-Z])/g, " $1").toLowerCase();
}

function Badge({ value }: { value: string }) {
  const accent = BADGE_ACCENT[value] ?? "var(--steel-300)";
  return (
    <span
      className="rounded-full border px-2.5 py-0.5 font-mono text-[11px] uppercase tracking-wide"
      style={{ borderColor: accent, color: accent }}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

function Stat({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  unit?: string;
  sub?: string;
}) {
  return (
    <div>
      <div className="stamp-label mb-1">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-3xl font-semibold text-steel-100">{value}</span>
        {unit && <span className="text-sm text-steel-400">{unit}</span>}
      </div>
      {sub && <div className="mt-0.5 text-xs text-steel-400">{sub}</div>}
    </div>
  );
}

function UnverifiedBanner() {
  return (
    <p className="rounded-md border border-hazard-yellow/40 bg-hazard-yellow/10 px-3 py-2 text-xs text-hazard-yellow">
      ⚠ Config standar ini <span className="font-mono">unverified</span> — jangan pakai sebagai
      dasar keputusan inspeksi.
    </p>
  );
}

function ErrorView({ data }: { data: unknown }) {
  const rec = isRecord(data) ? data : {};
  const detail = formatErrorDetail(rec.detail);
  return (
    <div className="mt-4 rounded-md border border-kettle-red bg-kettle-red/10 p-4 text-sm text-kettle-red-bright">
      <p className="stamp-label mb-1 text-kettle-red-bright">
        {typeof rec.error === "string" ? rec.error : "Error"}
      </p>
      {detail && <p>{detail}</p>}
    </div>
  );
}

function ThicknessResultView(data: ThicknessResult) {
  if (data.verdict === "NOT_DEFINED") {
    return (
      <div className="mt-4 flex flex-col gap-3">
        <div className="rounded-md border border-steel-400/40 bg-steel-800 px-4 py-3 text-sm text-steel-300">
          <div className="mb-2 flex items-center gap-2">
            {data.standard && <span className="stamp-label">{data.standard}</span>}
            <Badge value="NOT_DEFINED" />
          </div>
          <p>{data.note ?? "Standar tidak menetapkan nilai untuk kombinasi input ini."}</p>
        </div>
        {data.unverified && <UnverifiedBanner />}
      </div>
    );
  }

  const req = data.requirement;
  const isIsoFamily = req?.localMinUm !== undefined;
  const failingLabels = (data.failingSpecimens ?? data.failingAreas ?? []).map((f) =>
    "specimen" in f ? `Spesimen ${f.specimen} (${f.avgUm} µm)` : `Area ${f.area} (${f.localUm} µm)`,
  );

  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {data.standard && <span className="stamp-label">{data.standard}</span>}
        {data.materialCategory && (
          <span className="stamp-label">· {data.materialCategory.replaceAll("_", " ").toLowerCase()}</span>
        )}
        {data.thicknessRange && <span className="stamp-label">· range {data.thicknessRange}</span>}
      </div>

      <div className="flex flex-wrap gap-8">
        {isIsoFamily ? (
          <>
            <Stat label="Minimum lokal" value={req?.localMinUm} unit="µm" />
            <Stat label="Minimum rata-rata" value={req?.meanMinUm} unit="µm" />
          </>
        ) : (
          <>
            <Stat
              label="Minimum rata-rata"
              value={req?.averageMinUm}
              unit="µm"
              sub={req?.averageMinMils ? `${req.averageMinMils} mils` : undefined}
            />
            <Stat
              label="Minimum spesimen individual"
              value={req?.individualSpecimenMinUm ?? "Review manual"}
              unit={req?.individualSpecimenMinUm != null ? "µm" : undefined}
            />
          </>
        )}
      </div>

      {data.maxThickness && <p className="text-xs text-steel-400">{data.maxThickness}</p>}

      {data.measured && (
        <div className="panel p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="stamp-label">Hasil pengukuran</span>
            {data.verdict && <Badge value={data.verdict} />}
          </div>
          <div className="flex flex-wrap gap-8">
            {data.measured.lotAverageUm !== undefined && (
              <Stat label="Rata-rata lot" value={data.measured.lotAverageUm} unit="µm" />
            )}
            {data.measured.meanUm !== undefined && (
              <Stat label="Rata-rata keseluruhan" value={data.measured.meanUm} unit="µm" />
            )}
          </div>
          {data.checks && (
            <div className="mt-3 flex flex-wrap gap-3">
              {Object.entries(data.checks).map(([key, value]) => (
                <span key={key} className="flex items-center gap-1.5 text-xs text-steel-300">
                  {formatLabel(key)} <Badge value={value} />
                </span>
              ))}
            </div>
          )}
          {failingLabels.length > 0 && (
            <p className="mt-3 text-xs text-kettle-red-bright">
              Tidak memenuhi syarat: {failingLabels.join(", ")}
            </p>
          )}
        </div>
      )}

      {data.note && <p className="text-xs text-steel-400">{data.note}</p>}
      {data.unverified && <UnverifiedBanner />}
    </div>
  );
}

function DurabilityResultView(data: DurabilityResult) {
  const worst = data.yearsRange?.worst;
  const best = data.yearsRange?.best;
  return (
    <div className="mt-4 flex flex-col gap-4">
      {data.category && <span className="stamp-label">Kategori korosivitas {data.category}</span>}
      <Stat
        label="Estimasi umur layan"
        value={worst !== undefined && best !== undefined ? `${worst}–${best}` : "—"}
        unit="tahun"
      />
      {data.method && <p className="text-xs text-steel-400">{data.method}</p>}
      {data.recommend && <p className="text-xs text-steel-300">{data.recommend}</p>}
      {data.unverified && <UnverifiedBanner />}
    </div>
  );
}

function ReactivityResultView(data: ReactivityResult) {
  return (
    <div className="mt-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-4">
        <Stat label="Si-equivalent" value={data.siEquivalent} unit="%" />
        {data.zone && <Badge value={data.zone} />}
      </div>
      {data.expectation && <p className="text-sm text-steel-100">{data.expectation}</p>}
      {data.disclaimer && <p className="text-xs text-steel-400">{data.disclaimer}</p>}
      {data.unverified && <UnverifiedBanner />}
    </div>
  );
}

export type ResultKind = "thickness" | "durability" | "reactivity";

export function ResultView({
  kind,
  result,
}: {
  kind: ResultKind;
  result: { ok: boolean; data: unknown } | null;
}) {
  if (!result) return null;
  if (!result.ok || !isRecord(result.data)) return <ErrorView data={result.data} />;

  const data = result.data;
  return (
    <>
      {kind === "thickness" && <ThicknessResultView {...(data as ThicknessResult)} />}
      {kind === "durability" && <DurabilityResultView {...(data as DurabilityResult)} />}
      {kind === "reactivity" && <ReactivityResultView {...(data as ReactivityResult)} />}
      <details className="mt-3 text-xs text-steel-400">
        <summary className="cursor-pointer select-none stamp-label inline">Lihat JSON mentah</summary>
        <pre className="mt-2 overflow-x-auto rounded-md border border-panel-border bg-steel-950 p-3 font-mono text-xs text-steel-300">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </>
  );
}
