# Inventaris Tool v1 — Kontrak & Implementasi

Semua tool hidup di `apps/web/lib/tools/`. Angka dibaca dari
`packages/engineering-config/`.

## 1. `check_coating_thickness` — Coating Thickness Checker

Entry point tunggal untuk ketiga standar, dispatch berdasarkan `standard`.

```ts
// lib/tools/coating-thickness/index.ts
import { ThicknessInput } from "./schema";
import { checkAstmA123 } from "./astm-a123";
import { checkIsoFamily } from "./iso-family";

export function checkCoatingThickness(raw: unknown) {
  const input = ThicknessInput.parse(raw);
  switch (input.standard) {
    case "ASTM_A123": return checkAstmA123(input);
    case "ISO1461":
    case "ASNZS4680": return checkIsoFamily(input);
  }
}
```

### Skema

```ts
// lib/tools/coating-thickness/schema.ts
import { z } from "zod";

const Readings = z.array(z.array(z.number().nonnegative()).min(1)).min(1);
// ASTM   -> array per specimen,       isi = pembacaan dalam specimen tsb
// ISO/AS -> array per reference area, isi = pembacaan dalam area tsb

export const ThicknessInput = z.discriminatedUnion("standard", [
  z.object({
    standard: z.literal("ASTM_A123"),
    materialCategory: z.enum([
      "STRUCTURAL_SHAPES", "STRIP_BAR", "PLATE", "PIPE_TUBING",
      "WIRE", "REINFORCING_BAR", "FORGINGS_CASTINGS",
    ]),
    steelThickness: z.number().positive(),
    unit: z.enum(["mm", "in"]).default("mm"),
    readingsUm: Readings.optional(),
  }),
  z.object({
    standard: z.literal("ISO1461"),
    steelThicknessMm: z.number().positive().max(300),
    isCasting: z.boolean().default(false),
    readingsUm: Readings.optional(),
  }),
  z.object({
    standard: z.literal("ASNZS4680"),
    steelThicknessMm: z.number().positive().max(300),
    readingsUm: Readings.optional(),
  }),
]);

export type ThicknessInputT = z.infer<typeof ThicknessInput>;
```

### Helper rentang

```ts
// lib/tools/coating-thickness/range.ts
export interface Range {
  min: number; min_incl: boolean;
  max: number | null; max_incl?: boolean;
}

export const inRange = (t: number, r: Range) =>
  (r.min_incl ? t >= r.min : t > r.min) &&
  (r.max === null || (r.max_incl ? t <= r.max : t < r.max));

export const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
export const round1 = (x: number) => Math.round(x * 10) / 10;
```

`inRange` adalah satu-satunya tempat inklusivitas batas diterjemahkan jadi
perbandingan. Jangan menulis perbandingan batas secara ad-hoc di tempat lain.

### ASTM A123

```ts
// lib/tools/coating-thickness/astm-a123.ts
import cfg from "@galva/engineering-config/astm-a123.v1.json";
import { inRange, mean, round1 } from "./range";

type Category = keyof typeof cfg.table1;

export function checkAstmA123(input: {
  materialCategory: Category;
  steelThickness: number;
  unit: "mm" | "in";
  readingsUm?: number[][];
}) {
  const ranges = input.unit === "in"
    ? cfg.thickness_ranges.imperial_in
    : cfg.thickness_ranges.metric_mm;

  const range = ranges.find(r => inRange(input.steelThickness, r));
  if (!range) throw new Error("Ketebalan baja di luar rentang Table 1");

  const requiredGrade =
    (cfg.table1[input.materialCategory] as Record<string, number | null>)[range.id];

  if (requiredGrade === null) {
    return {
      standard: `${cfg.standard} (${cfg.edition})`,
      materialCategory: input.materialCategory,
      thicknessRange: range.id,
      verdict: "NOT_DEFINED",
      note:
        "Table 1 ASTM A123-24 tidak menetapkan grade untuk kategori & rentang tebal ini. " +
        "Periksa apakah kategori sudah benar (Appendix X1.1), atau apakah produk " +
        "seharusnya mengacu ke ASTM A153 / A767. Konsultasikan dengan galvanizer.",
    };
  }

  const idx = cfg.grades.indexOf(requiredGrade);
  const individualMinGrade = idx > 0 ? cfg.grades[idx - 1] : null; // urutan Table 2

  const result: Record<string, unknown> = {
    standard: `${cfg.standard} (${cfg.edition})`,
    materialCategory: input.materialCategory,
    thicknessRange: range.id,
    requirement: {
      coatingGrade: requiredGrade,
      averageMinUm: requiredGrade,
      averageMinMils:
        cfg.grade_table[String(requiredGrade) as keyof typeof cfg.grade_table].mils,
      individualSpecimenMinUm: individualMinGrade, // null -> butuh review manual
    },
    maxThickness: "Tidak ada batas maksimum di ASTM A123",
  };

  if (input.readingsUm?.length) {
    const specimenAvgs = input.readingsUm.map(mean);
    const lotAvg = mean(specimenAvgs);
    const failingSpecimens = individualMinGrade === null
      ? []
      : specimenAvgs
          .map((v, i) => ({ specimen: i + 1, avgUm: round1(v) }))
          .filter(s => s.avgUm < individualMinGrade);

    const lotPass = lotAvg >= requiredGrade;
    const indivPass = failingSpecimens.length === 0;

    result.measured = {
      specimenAveragesUm: specimenAvgs.map(round1),
      lotAverageUm: round1(lotAvg),
    };
    result.checks = {
      lotAverage: lotPass ? "PASS" : "FAIL",
      individualSpecimens: indivPass ? "PASS" : "FAIL",
    };
    result.failingSpecimens = failingSpecimens;
    result.verdict = lotPass && indivPass ? "CONFORMS" : "NON_CONFORMING";
  }

  result.note =
    "Screening berdasarkan Table 1 ASTM A123-24 memakai tebal baja TERUKUR " +
    "(bagian paling tipis untuk tapered/structural shapes, Appendix X1.2). " +
    "Jumlah specimen & titik ukur mengikuti klausul sampling A123 dan ASTM E376. " +
    "Assembly multi-material dievaluasi per kategori.";
  if (cfg.unverified) result.unverified = true;
  return result;
}
```

Perhatikan `individualSpecimenMinUm` diambil dari **urutan `cfg.grades`
(Table 2)**, bukan dari nilai-nilai yang muncul di Table 1. Grade 100 → 85,
walaupun 85 tidak pernah muncul sebagai syarat di Table 1.

### ISO 1461 / AS/NZS 4680

```ts
// lib/tools/coating-thickness/iso-family.ts
import iso1461 from "@galva/engineering-config/iso1461.v1.json";
import asnzs4680 from "@galva/engineering-config/asnzs4680.v1.json";
import { inRange, mean, round1 } from "./range";

export function checkIsoFamily(input: {
  standard: "ISO1461" | "ASNZS4680";
  steelThicknessMm: number;
  isCasting?: boolean;
  readingsUm?: number[][];
}) {
  const cfg = input.standard === "ISO1461" ? iso1461 : asnzs4680;
  const table = input.isCasting && "castings" in cfg ? cfg.castings : cfg.rows;
  const row = table.find(r => inRange(input.steelThicknessMm, r));
  if (!row) throw new Error("Ketebalan baja di luar tabel");

  const result: Record<string, unknown> = {
    standard: `${cfg.standard} (${cfg.edition})`,
    requirement: { localMinUm: row.local_um, meanMinUm: row.mean_um },
  };

  if (input.readingsUm?.length) {
    const locals = input.readingsUm.map(mean);   // local thickness per reference area
    const overallMean = mean(locals);
    const failingAreas = locals
      .map((v, i) => ({ area: i + 1, localUm: round1(v) }))
      .filter(a => a.localUm < row.local_um);

    const localPass = failingAreas.length === 0;
    const meanPass = overallMean >= row.mean_um;

    result.measured = { localThicknessesUm: locals.map(round1), meanUm: round1(overallMean) };
    result.checks = { local: localPass ? "PASS" : "FAIL", mean: meanPass ? "PASS" : "FAIL" };
    result.failingAreas = failingAreas;
    result.verdict = localPass && meanPass ? "CONFORMS" : "NON_CONFORMING";
  }

  result.note =
    "Screening. Jumlah & ukuran reference area mengikuti klausul sampling standar. " +
    "Artikel yang di-centrifuge memakai tabel berbeda (belum didukung v1).";
  if (cfg.unverified) result.unverified = true;
  return result;
}
```

## 2. `compare_thickness_standards`

Memanggil tool yang sama tiga kali dengan input baja identik. Dipakai untuk
menjawab "kalau spek proyek pakai ASTM, apakah hasil galvanis yang lolos ISO
tetap lolos?".

```ts
// lib/tools/coating-thickness/compare.ts
import { checkCoatingThickness } from "./index";

export function compareStandards(p: {
  steelThicknessMm: number;
  materialCategory: "STRUCTURAL_SHAPES" | "STRIP_BAR" | "PLATE" | "PIPE_TUBING"
                  | "WIRE" | "REINFORCING_BAR" | "FORGINGS_CASTINGS";
}) {
  return {
    astmA123: checkCoatingThickness({
      standard: "ASTM_A123", materialCategory: p.materialCategory,
      steelThickness: p.steelThicknessMm, unit: "mm",
    }),
    iso1461:   checkCoatingThickness({ standard: "ISO1461",   steelThicknessMm: p.steelThicknessMm }),
    asnzs4680: checkCoatingThickness({ standard: "ASNZS4680", steelThicknessMm: p.steelThicknessMm }),
  };
}
```

Hasilnya ditampilkan berdampingan dengan label, tidak pernah digabung.

## 3. `estimate_durability`

```ts
// lib/tools/durability.ts
import zincRates from "@galva/engineering-config/iso9223-zinc.v1.json";

export function estimateLife(coatingUm: number, category: keyof typeof zincRates.rates) {
  const [lo, hi] = zincRates.rates[category];
  const best = lo === 0 ? Infinity : coatingUm / lo;
  const worst = coatingUm / hi;
  return {
    category,
    yearsRange: {
      worst: Math.round(worst),
      best: Number.isFinite(best) ? Math.round(best) : ">100",
    },
    method: "Linear consumption (ISO 9223 zinc rates) — estimasi kasar",
    recommend: "Untuk proyek nyata gunakan GAA Durability Estimator / AGA LCCC dan data lokasi.",
  };
}
```

Selalu rentang. `C1` (lo = 0) mengembalikan `">100"`, bukan `Infinity`.

## 4. `screen_steel_reactivity`

```ts
// lib/tools/steel-reactivity.ts
export function screenReactivity(siPct: number, pPct = 0) {
  const siEq = siPct + 2.5 * pPct;
  let zone: string, expectation: string;
  if (siEq < 0.04)       { zone = "LOW";      expectation = "Coating relatif tipis & mengkilap"; }
  else if (siEq <= 0.15) { zone = "SANDELIN"; expectation = "Sangat reaktif: tebal, kusam, risiko getas"; }
  else if (siEq <= 0.22) { zone = "MODERATE"; expectation = "Reaktivitas terkendali"; }
  else                   { zone = "HIGH";     expectation = "Tebal, abu-abu matte"; }
  return {
    siEquivalent: +siEq.toFixed(3), zone, expectation,
    disclaimer: "Batas zona bersifat indikatif; suhu bath & paduan (mis. Ni) juga berpengaruh.",
  };
}
```

Output ini **screening**, bukan verdict. Coating abu-abu kusam bukan cacat
selama ketebalan dan adhesi memenuhi spesifikasi.

## 5. Unit converter

```ts
// lib/tools/units.ts
export const MICRON_PER_MIL = 25.4;
export const ZINC_DENSITY_G_CM3 = 7.14;   // 1 um zinc ~ 7,14 g/m2
export const GM2_PER_OZFT2 = 305.15;

export const milToMicron = (mil: number) => mil * MICRON_PER_MIL;
export const micronToGm2 = (um: number) => um * ZINC_DENSITY_G_CM3;
export const ozft2ToGm2  = (oz: number) => oz * GM2_PER_OZFT2;
export const gm2ToMicron = (g: number)  => g / ZINC_DENSITY_G_CM3;
```
