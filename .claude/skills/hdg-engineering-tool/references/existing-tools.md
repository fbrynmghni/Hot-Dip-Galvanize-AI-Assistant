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
import { propagateUnverified } from "../unverified";
import { MM_PER_INCH } from "../units";

type Category = keyof typeof cfg.table1;

// Sanity check untuk input tak masuk akal -- BUKAN batas ASTM A123 (standar
// tidak menetapkan batas maksimum ketebalan). Tanpa ini, typo satuan/angka
// (mis. "50000" alih-alih "50") tetap dijawab Grade 100 dengan percaya diri.
const SANITY_MAX_MM = 300;

export function checkAstmA123(input: {
  materialCategory: Category;
  steelThickness: number;
  unit: "mm" | "in";
  readingsUm?: number[][];
}) {
  const sanityMax = input.unit === "in" ? SANITY_MAX_MM / MM_PER_INCH : SANITY_MAX_MM;
  if (input.steelThickness > sanityMax) {
    throw new Error(
      `Tebal baja ${input.steelThickness} ${input.unit} tidak masuk akal (> ${sanityMax.toFixed(1)} ${input.unit}). ` +
      "Ini bukan batas ASTM A123 -- ini sanity check input. Cek kemungkinan salah satuan/angka."
    );
  }

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
    const lotPass = lotAvg >= requiredGrade;

    result.measured = {
      specimenAveragesUm: specimenAvgs.map(round1),
      lotAverageUm: round1(lotAvg),
    };

    if (individualMinGrade === null) {
      // Grade terendah (35) tidak punya grade di bawahnya di Table 2 -- WAJIB
      // "tidak pernah dicek", BUKAN "PASS" diam-diam. Lihat CLAUDE.md #7 dan
      // hdg-standards-config #5: sel kosong bukan izin menebak. Melewatkan
      // langkah ini adalah bug nyata yang pernah masuk ke v1 -- baja nyaris
      // telanjang bisa lolos sebagai CONFORMS kalau individual specimen
      // dipaksa PASS saat tidak ada angka pembanding.
      result.checks = { lotAverage: lotPass ? "PASS" : "FAIL", individualSpecimens: "NOT_CHECKED" };
      result.failingSpecimens = [];
      result.verdict = lotPass ? "NEEDS_MANUAL_REVIEW" : "NON_CONFORMING";
      result.note =
        "Table 2 tidak menyediakan grade di bawah 35 -- kesesuaian specimen individual " +
        "tidak dapat dihitung otomatis dan wajib direview manual oleh galvanizer/inspector.";
    } else {
      const failingSpecimens = specimenAvgs
        .map((v, i) => ({ specimen: i + 1, avgUm: round1(v) }))
        .filter(s => s.avgUm < individualMinGrade);
      const indivPass = failingSpecimens.length === 0;

      result.checks = {
        lotAverage: lotPass ? "PASS" : "FAIL",
        individualSpecimens: indivPass ? "PASS" : "FAIL",
      };
      result.failingSpecimens = failingSpecimens;
      result.verdict = lotPass && indivPass ? "CONFORMS" : "NON_CONFORMING";
    }
  }

  const generalNote =
    "Screening berdasarkan Table 1 ASTM A123-24 memakai tebal baja TERUKUR " +
    "(bagian paling tipis untuk tapered/structural shapes, Appendix X1.2). " +
    "Jumlah specimen & titik ukur mengikuti klausul sampling A123 dan ASTM E376. " +
    "Assembly multi-material dievaluasi per kategori.";
  result.note = result.note ? `${result.note} ${generalNote}` : generalNote;
  propagateUnverified(result, cfg); // helper bersama, lihat "Unverified flag" di bawah
  return result;
}
```

Perhatikan `individualSpecimenMinUm` diambil dari **urutan `cfg.grades`
(Table 2)**, bukan dari nilai-nilai yang muncul di Table 1. Grade 100 → 85,
walaupun 85 tidak pernah muncul sebagai syarat di Table 1.

Juga wajib ada **sanity check** pada `steelThickness` (mis. > 300mm / >11.8in)
sebelum mencari rentang. Ini BUKAN batas dari ASTM A123 — standar memang tidak
menetapkan batas maksimum — tapi tanpa sanity check, input typo (salah satuan,
angka kelebihan digit) akan tetap dijawab dengan percaya diri sebagai Grade
100 alih-alih ditolak sebagai input tidak masuk akal.

### Unverified flag — helper bersama

Setiap tool yang membaca config `unverified` memakai helper yang sama, bukan
menulis `if (cfg.unverified) result.unverified = true;` berulang di tiap file:

```ts
// lib/tools/unverified.ts
export function propagateUnverified(
  result: Record<string, unknown>,
  cfg: { unverified?: boolean },
): void {
  if (cfg.unverified) result.unverified = true;
}
```

### ISO 1461 / AS/NZS 4680

```ts
// lib/tools/coating-thickness/iso-family.ts
import iso1461 from "@galva/engineering-config/iso1461.v1.json";
import asnzs4680 from "@galva/engineering-config/asnzs4680.v1.json";
import { inRange, mean, round1, type Range } from "./range";
import { propagateUnverified } from "../unverified";

export function checkIsoFamily(input: {
  standard: "ISO1461" | "ASNZS4680";
  steelThicknessMm: number;
  isCasting?: boolean;
  readingsUm?: number[][];
}) {
  // JSON import types don't narrow well through `"castings" in cfg` on a
  // union -- cast explicitly instead of fighting the inference.
  type ThicknessRow = Range & { local_um: number; mean_um: number };
  const cfg = input.standard === "ISO1461" ? iso1461 : asnzs4680;
  const table = (input.isCasting && "castings" in cfg ? cfg.castings : cfg.rows) as ThicknessRow[];
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

  propagateUnverified(result, cfg);
  return result;
}
```

## 2. `compare_thickness_standards`

Memanggil tool yang sama tiga kali dengan input baja identik. Dipakai untuk
menjawab "kalau spek proyek pakai ASTM, apakah hasil galvanis yang lolos ISO
tetap lolos?".

Seperti tool lain, terima `raw: unknown` dan validasi sendiri lewat Zod —
jangan terima objek yang sudah ditipekan tapi tidak divalidasi, dan jangan
taruh skema-nya di route handler (lihat "Kenapa `raw: unknown` di semua tool"
di bawah). Kategori material di-reuse dari `MATERIAL_CATEGORIES` yang
diekspor `schema.ts` — satu sumber kebenaran, bukan enum yang diketik ulang.

```ts
// lib/tools/coating-thickness/compare.ts
import { z } from "zod";
import { checkCoatingThickness } from "./index";
import { MATERIAL_CATEGORIES } from "./schema";

export const CompareInput = z.object({
  steelThicknessMm: z.number().positive(),
  materialCategory: z.enum(MATERIAL_CATEGORIES),
});

export function compareStandards(raw: unknown) {
  const p = CompareInput.parse(raw);
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
import { z } from "zod";
import zincRates from "@galva/engineering-config/iso9223-zinc.v1.json";
import { propagateUnverified } from "./unverified";

export const DurabilityInput = z.object({
  coatingUm: z.number().positive(),
  category: z.enum(["C1", "C2", "C3", "C4", "C5", "CX"]),
});

export function estimateLife(raw: unknown) {
  const { coatingUm, category } = DurabilityInput.parse(raw);
  const [lo, hi] = zincRates.rates[category];
  const best = lo === 0 ? Infinity : coatingUm / lo;
  const worst = coatingUm / hi;
  const result: Record<string, unknown> = {
    category,
    yearsRange: {
      worst: Math.round(worst),
      best: Number.isFinite(best) ? Math.round(best) : ">100",
    },
    method: "Linear consumption (ISO 9223 zinc rates) — estimasi kasar",
    recommend: "Untuk proyek nyata gunakan GAA Durability Estimator / AGA LCCC dan data lokasi.",
  };
  propagateUnverified(result, zincRates);
  return result;
}
```

Selalu rentang. `C1` (lo = 0) mengembalikan `">100"`, bukan `Infinity`.

## 4. `screen_steel_reactivity`

```ts
// lib/tools/steel-reactivity.ts
import { z } from "zod";

export const ReactivityInput = z.object({
  siPct: z.number(),
  pPct: z.number().optional(),
});

export function screenReactivity(raw: unknown) {
  const { siPct, pPct = 0 } = ReactivityInput.parse(raw);
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
export const MM_PER_INCH = 25.4;          // konstanta terpisah dari MICRON_PER_MIL walau
                                           // nilainya sama -- konversi yang berbeda secara
                                           // konsep tidak boleh berbagi nama konstanta
export const ZINC_DENSITY_G_CM3 = 7.14;   // 1 um zinc ~ 7,14 g/m2
export const GM2_PER_OZFT2 = 305.15;

export const milToMicron = (mil: number) => mil * MICRON_PER_MIL;
export const micronToGm2 = (um: number) => um * ZINC_DENSITY_G_CM3;
export const ozft2ToGm2  = (oz: number) => oz * GM2_PER_OZFT2;
export const gm2ToMicron = (g: number)  => g / ZINC_DENSITY_G_CM3;
export const mmToIn      = (mm: number) => mm / MM_PER_INCH;
```

Setiap tool yang perlu konversi satuan **wajib** import dari sini, bukan
menulis angka konversi (`25.4`, dll.) langsung di file tool — kalau kamu
menulis angka konversi baru, itu tandanya konstanta itu belum ada di sini.

## Kenapa `raw: unknown` di semua tool

Semua fungsi tool di atas (`checkCoatingThickness`, `compareStandards`,
`estimateLife`, `screenReactivity`) menerima `raw: unknown` dan memvalidasi
lewat Zod **di dalam file tool itu sendiri** — bukan di route handler
`/api/tools/[name]/route.ts`, dan bukan sebagai objek yang sudah ditipekan
tanpa validasi.

Alasannya: orchestrator chat (`hdg-chat-guardrails/references/orchestrator.md`)
memanggil tool lewat `TOOL_IMPL[name](input)` dengan `input: unknown` langsung
dari tool-calling LLM, dan mengasumsikan "validasi Zod di dalam". Kalau skema
validasi tool hidup di route handler HTTP, jalur chat harus menduplikasi skema
itu (atau `lib/llm` harus import dari `app/api/...`, membalik arah dependency
yang seharusnya). Route handler jadi murni: `parse JSON body → panggil
tool(body) → kembalikan hasil / tangkap ZodError`, sama persis untuk kedua
jalur pemanggilan (HTTP kalkulator maupun tool-calling chat).
