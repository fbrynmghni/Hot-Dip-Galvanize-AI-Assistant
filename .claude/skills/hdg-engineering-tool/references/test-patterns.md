# Pola Unit Test — Coating Thickness

Salin sebagai titik awal ke `apps/web/tests/coating-thickness.test.ts`.
Setiap titik batas wajib punya test; setelah verifikasi ke edisi standar,
**update test dulu, baru config**.

```ts
import { describe, it, expect } from "vitest";
import { checkCoatingThickness } from "@/lib/tools/coating-thickness";

const astm = (cat: string, t: number, unit: "mm" | "in" = "mm", readingsUm?: number[][]) =>
  checkCoatingThickness({
    standard: "ASTM_A123", materialCategory: cat, steelThickness: t, unit, readingsUm,
  }) as any;

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
      [130, 140, 135], [125, 128, 131], [80, 82, 79],  // specimen 3 avg ≈ 80 < 85
    ]);
    expect(r.checks.lotAverage).toBe("PASS");
    expect(r.checks.individualSpecimens).toBe("FAIL");
    expect(r.verdict).toBe("NON_CONFORMING");
  });
  it("plate 10 mm rata-rata 90 µm → CONFORMS (Grade 75, individu min 65)", () => {
    const r = astm("PLATE", 10, "mm", [[90, 92, 88], [89, 91, 90]]);
    expect(r.verdict).toBe("CONFORMS");
  });
});

describe("ISO 1461", () => {
  const iso = (t: number, extra = {}) =>
    checkCoatingThickness({ standard: "ISO1461", steelThicknessMm: t, ...extra }) as any;

  it("plat 10 mm → local 70 / mean 85", () => {
    expect(iso(10).requirement).toEqual({ localMinUm: 70, meanMinUm: 85 });
  });
  it("tepat 6 mm → kelas >3 s/d ≤6", () => {
    expect(iso(6).requirement).toEqual({ localMinUm: 55, meanMinUm: 70 });
  });
  it("tepat 3 mm → kelas ≥1,5 s/d ≤3", () => {
    expect(iso(3).requirement).toEqual({ localMinUm: 45, meanMinUm: 55 });
  });
  it("tepat 1,5 mm → kelas ≥1,5 s/d ≤3 (45/55)", () => {
    expect(iso(1.5).requirement).toEqual({ localMinUm: 45, meanMinUm: 55 });
  });
  it("casting 8 mm → 70/80", () => {
    expect(iso(8, { isCasting: true }).requirement).toEqual({ localMinUm: 70, meanMinUm: 80 });
  });
  it("satu reference area di bawah local → NON_CONFORMING", () => {
    const r = iso(10, { readingsUm: [[95, 100], [90, 92], [60, 65]] });
    expect(r.checks.local).toBe("FAIL");
    expect(r.verdict).toBe("NON_CONFORMING");
  });
});

describe("AS/NZS 4680", () => {
  const as = (t: number) =>
    checkCoatingThickness({ standard: "ASNZS4680", steelThicknessMm: t }) as any;

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
});
```

## Kasus yang mudah terlewat

Selain boundary, pastikan ada test untuk:

- **Kategori yang salah memberi jawaban berbeda** — plate vs structural shapes
  di tebal yang sama. Ini kesalahan paling mahal di produksi.
- **`individualSpecimenMinUm` diambil dari Table 2, bukan Table 1** — grade 100
  → 85, dan 85 tidak pernah muncul sebagai syarat di Table 1.
- **Grade terendah** (35) tidak punya grade di bawahnya → `null`, dan tool tidak
  melakukan pengecekan individu, bukan memakai 0.
- **Perbedaan ISO vs AS/NZS tepat di 1,5 mm** — satu-satunya tempat kedua
  standar berbeda; test ini yang menjaga kedua config tidak pernah digabung.
- **Konversi satuan tidak dipakai untuk menentukan rentang** — tebal dalam inci
  dicocokkan ke tabel imperial, bukan dikonversi ke mm lalu dicocokkan ke tabel
  metric. Hasilnya bisa berbeda di titik batas.
