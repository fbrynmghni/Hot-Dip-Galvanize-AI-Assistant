import { describe, it, expect } from "vitest";
import { compareStandards } from "@/lib/tools/coating-thickness/compare";
import { MATERIAL_CATEGORIES } from "@/lib/tools/coating-thickness/schema";

describe("compareStandards", () => {
  it.each(MATERIAL_CATEGORIES)(
    "menerima semua kategori dari MATERIAL_CATEGORIES tanpa error: %s",
    (materialCategory) => {
      // Regression guard: kategori diimpor dari satu-satunya sumber kebenaran
      // (schema.ts) di sini dan di route handler /api/tools -- kalau nanti
      // ada kategori baru ditambah di schema.ts tapi lupa disinkronkan,
      // masalahnya akan muncul di sini, bukan di produksi.
      expect(() => compareStandards({ steelThicknessMm: 10, materialCategory })).not.toThrow();
    },
  );
});
