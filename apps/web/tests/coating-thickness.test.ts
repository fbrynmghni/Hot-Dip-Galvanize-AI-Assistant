import { describe, it, expect } from "vitest";
import { checkCoatingThickness } from "@/lib/tools/coating-thickness";

// Kedua cabang standar mengembalikan bentuk berbeda (Record<string, unknown>
// di implementasi) -- tipe longgar ini hanya untuk kenyamanan assertion test,
// bukan kontrak publik tool.
interface ThicknessTestResult {
  requirement: {
    coatingGrade?: number;
    individualSpecimenMinUm?: number | null;
    localMinUm?: number;
    meanMinUm?: number;
  };
  verdict?: string;
  checks: {
    lotAverage?: string;
    individualSpecimens?: string;
    local?: string;
    mean?: string;
  };
}

const asTestResult = (raw: unknown) => raw as unknown as ThicknessTestResult;

const astm = (cat: string, t: number, unit: "mm" | "in" = "mm", readingsUm?: number[][]) =>
  asTestResult(
    checkCoatingThickness({
      standard: "ASTM_A123",
      materialCategory: cat,
      steelThickness: t,
      unit,
      readingsUm,
    }),
  );

describe("ASTM A123-24 — Table 1", () => {
  it("structural shapes 10 mm → Grade 100, individu min Grade 85 (Table 2)", () => {
    const r = astm("STRUCTURAL_SHAPES", 10);
    expect(r.requirement.coatingGrade).toBe(100);
    expect(r.requirement.individualSpecimenMinUm).toBe(85);
  });

  it("plate 10 mm → Grade 75 (revisi 2024, bukan 100)", () => {
    expect(astm("PLATE", 10).requirement.coatingGrade).toBe(75);
  });

  it("plate girder ½ in → Grade 75, rolled beam ½ in → Grade 100 (Appendix X1.1)", () => {
    expect(astm("PLATE", 0.5, "in").requirement.coatingGrade).toBe(75);
    expect(astm("STRUCTURAL_SHAPES", 0.5, "in").requirement.coatingGrade).toBe(100);
  });

  it("pole dari plat 5/8 in → Grade 100 (bukan pipe 75)", () => {
    expect(astm("PLATE", 0.625, "in").requirement.coatingGrade).toBe(100);
    expect(astm("PIPE_TUBING", 0.625, "in").requirement.coatingGrade).toBe(75);
  });

  it("strip & bar 20 mm → Grade 100", () => {
    expect(astm("STRIP_BAR", 20).requirement.coatingGrade).toBe(100);
  });

  it("structural shapes 5 mm (R4) → Grade 75 (sebelumnya 85)", () => {
    expect(astm("STRUCTURAL_SHAPES", 5).requirement.coatingGrade).toBe(75);
  });

  it("wire 2 mm → Grade 50", () => {
    expect(astm("WIRE", 2).requirement.coatingGrade).toBe(50);
  });
});

describe("ASTM A123-24 — titik batas metric", () => {
  it("tepat 1,6 mm → R2 (plate Grade 65)", () => {
    expect(astm("PLATE", 1.6).requirement.coatingGrade).toBe(65);
  });
  it("tepat 3,2 mm → R3 (plate Grade 75)", () => {
    expect(astm("PLATE", 3.2).requirement.coatingGrade).toBe(75);
  });
  it("tepat 4,8 mm → R3 (Grade 75)", () => {
    expect(astm("STRUCTURAL_SHAPES", 4.8).requirement.coatingGrade).toBe(75);
  });
  it("tepat 6,4 mm → R5 (structural 100, plate 75)", () => {
    expect(astm("STRUCTURAL_SHAPES", 6.4).requirement.coatingGrade).toBe(100);
    expect(astm("PLATE", 6.4).requirement.coatingGrade).toBe(75);
  });
  it("tepat 16 mm → R6 (plate 100)", () => {
    expect(astm("PLATE", 16).requirement.coatingGrade).toBe(100);
  });
});

describe("ASTM A123-24 — kategori baru & sel kosong", () => {
  it("reinforcing bar 12 mm → Grade 100", () => {
    expect(astm("REINFORCING_BAR", 12).requirement.coatingGrade).toBe(100);
  });
  it("reinforcing bar 3 mm → NOT_DEFINED", () => {
    expect(astm("REINFORCING_BAR", 3).verdict).toBe("NOT_DEFINED");
  });
  it("forgings & castings 5 mm → Grade 100; 4 mm → NOT_DEFINED", () => {
    expect(astm("FORGINGS_CASTINGS", 5).requirement.coatingGrade).toBe(100);
    expect(astm("FORGINGS_CASTINGS", 4).verdict).toBe("NOT_DEFINED");
  });
  it("wire < 1/16 in → Grade 35, individu = null (review manual)", () => {
    const r = astm("WIRE", 0.05, "in");
    expect(r.requirement.coatingGrade).toBe(35);
    expect(r.requirement.individualSpecimenMinUm).toBeNull();
  });
});

describe("ASTM A123-24 — evaluasi pembacaan", () => {
  it("lot rata-rata OK tapi 1 specimen < Grade 85 → NON_CONFORMING", () => {
    const r = astm("STRUCTURAL_SHAPES", 10, "mm", [
      [130, 140, 135],
      [125, 128, 131],
      [80, 82, 79], // specimen 3 avg ≈ 80 < 85
    ]);
    expect(r.checks.lotAverage).toBe("PASS");
    expect(r.checks.individualSpecimens).toBe("FAIL");
    expect(r.verdict).toBe("NON_CONFORMING");
  });
  it("plate 10 mm rata-rata 90 µm → CONFORMS (Grade 75, individu min 65)", () => {
    const r = astm("PLATE", 10, "mm", [
      [90, 92, 88],
      [89, 91, 90],
    ]);
    expect(r.verdict).toBe("CONFORMS");
  });
});

describe("ISO 1461", () => {
  const iso = (t: number, extra = {}) =>
    asTestResult(checkCoatingThickness({ standard: "ISO1461", steelThicknessMm: t, ...extra }));

  it("plat 10 mm → local 70 / mean 85", () => {
    expect(iso(10).requirement).toEqual({ localMinUm: 70, meanMinUm: 85 });
  });
  it("tepat 6 mm → kelas >3 s/d ≤6", () => {
    expect(iso(6).requirement).toEqual({ localMinUm: 55, meanMinUm: 70 });
  });
  it("tepat 3 mm → kelas ≥1,5 s/d ≤3", () => {
    expect(iso(3).requirement).toEqual({ localMinUm: 45, meanMinUm: 55 });
  });
  it("tepat 1,5 mm → kelas ≥1,5 s/d ≤3 (45/55) — lihat catatan unconfirmed di iso-asnzs.md", () => {
    expect(iso(1.5).requirement).toEqual({ localMinUm: 45, meanMinUm: 55 });
  });
  it("casting 8 mm → 70/80", () => {
    expect(iso(8, { isCasting: true }).requirement).toEqual({ localMinUm: 70, meanMinUm: 80 });
  });
  it("satu reference area di bawah local → NON_CONFORMING", () => {
    const r = iso(10, {
      readingsUm: [
        [95, 100],
        [90, 92],
        [60, 65],
      ],
    });
    expect(r.checks.local).toBe("FAIL");
    expect(r.verdict).toBe("NON_CONFORMING");
  });
});

describe("AS/NZS 4680", () => {
  const as = (t: number) =>
    asTestResult(checkCoatingThickness({ standard: "ASNZS4680", steelThicknessMm: t }));

  it("tepat 1,5 mm → kelas ≤1,5 (35/45) — BEDA dengan ISO 1461", () => {
    expect(as(1.5).requirement).toEqual({ localMinUm: 35, meanMinUm: 45 });
  });
  it("tepat 3 mm → 45/55", () => {
    expect(as(3).requirement).toEqual({ localMinUm: 45, meanMinUm: 55 });
  });
  it("tepat 6 mm → 55/70", () => {
    expect(as(6).requirement).toEqual({ localMinUm: 55, meanMinUm: 70 });
  });
  it("plat 10 mm → 70/85", () => {
    expect(as(10).requirement).toEqual({ localMinUm: 70, meanMinUm: 85 });
  });
});

describe("Validasi input", () => {
  it("ASTM tanpa materialCategory → error", () => {
    expect(() => checkCoatingThickness({ standard: "ASTM_A123", steelThickness: 10 })).toThrow();
  });
  it("tebal negatif → error", () => {
    expect(() => checkCoatingThickness({ standard: "ISO1461", steelThicknessMm: -1 })).toThrow();
  });
  it("standar tidak dikenal → error", () => {
    expect(() => checkCoatingThickness({ standard: "BS729", steelThicknessMm: 10 })).toThrow();
  });
  it("ASTM tebal tidak masuk akal (typo satuan/angka) → error, bukan Grade 100 diam-diam", () => {
    expect(() => astm("PLATE", 50000)).toThrow(/tidak masuk akal/);
  });
});

describe("ASTM A123-24 — grade terendah (35) tidak punya Table 2 di bawahnya", () => {
  it("wire tipis dengan 1 specimen nyaris telanjang → NEEDS_MANUAL_REVIEW, BUKAN CONFORMS diam-diam", () => {
    // requiredGrade 35 (WIRE, R1) -> individualSpecimenMinUm null -> tidak ada
    // angka Table 2 untuk membandingkan specimen individual. Lot rata-rata
    // lolos (69,70,69 dan 1,1,1 -> lot avg masih >= 35), tapi specimen kedua
    // nyaris tanpa coating -- tool wajib menandai butuh review manual, bukan
    // menyatakan CONFORMS.
    const r = astm("WIRE", 0.05, "in", [
      [69, 70, 69],
      [1, 1, 1],
    ]);
    expect(r.requirement.individualSpecimenMinUm).toBeNull();
    expect(r.checks.individualSpecimens).toBe("NOT_CHECKED");
    expect(r.verdict).toBe("NEEDS_MANUAL_REVIEW");
  });

  it("lot rata-rata juga gagal → tetap NON_CONFORMING, bukan NEEDS_MANUAL_REVIEW", () => {
    const r = astm("WIRE", 0.05, "in", [[10, 10, 10]]);
    expect(r.checks.lotAverage).toBe("FAIL");
    expect(r.verdict).toBe("NON_CONFORMING");
  });
});
