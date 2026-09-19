import cfg from "@galva/engineering-config/astm-a123.v1.json";
import { inRange, mean, round1 } from "./range";
import { propagateUnverified } from "../unverified";
import { MM_PER_INCH } from "../units";

type Category = keyof typeof cfg.table1;

// Sanity check untuk input tak masuk akal (typo satuan/angka) -- BUKAN batas
// dari standar. ASTM A123 memang tidak menetapkan batas maksimum ketebalan
// (Table 1 rentang R6 terbuka ke atas); ISO1461/ASNZS4680 punya .max(300) di
// Zod schema untuk alasan yang sama, jadi cap ini menyamakan input-sanity
// guard di ketiga standar tanpa mengklaim ada batas ASTM yang sebenarnya
// tidak ada.
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
        "Ini bukan batas ASTM A123 -- standar tidak menetapkan batas maksimum ketebalan -- " +
        "ini sanity check input. Cek kemungkinan salah satuan atau salah ketik angka.",
    );
  }

  const ranges =
    input.unit === "in" ? cfg.thickness_ranges.imperial_in : cfg.thickness_ranges.metric_mm;

  const range = ranges.find((r) => inRange(input.steelThickness, r));
  if (!range) throw new Error("Ketebalan baja di luar rentang Table 1");

  const requiredGrade = (cfg.table1[input.materialCategory] as Record<string, number | null>)[
    range.id
  ];

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
      averageMinMils: cfg.grade_table[String(requiredGrade) as keyof typeof cfg.grade_table].mils,
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
      // Grade terendah (35) tidak punya grade di bawahnya di Table 2 -- tidak
      // ada angka untuk membandingkan specimen individual. Ini BUKAN "PASS",
      // itu "tidak pernah dicek" -- lihat CLAUDE.md aturan #7 & hdg-standards-config
      // aturan #5: sel kosong bukan izin menebak.
      result.checks = {
        lotAverage: lotPass ? "PASS" : "FAIL",
        individualSpecimens: "NOT_CHECKED",
      };
      result.failingSpecimens = [];
      result.verdict = lotPass ? "NEEDS_MANUAL_REVIEW" : "NON_CONFORMING";
      result.note =
        "Table 2 tidak menyediakan grade di bawah 35 untuk syarat specimen individual — " +
        "kesesuaian specimen individual tidak dapat dihitung otomatis dan wajib direview manual " +
        "oleh galvanizer/inspector, meskipun rata-rata lot memenuhi syarat.";
    } else {
      const failingSpecimens = specimenAvgs
        .map((v, i) => ({ specimen: i + 1, avgUm: round1(v) }))
        .filter((s) => s.avgUm < individualMinGrade);
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
  propagateUnverified(result, cfg);
  return result;
}
