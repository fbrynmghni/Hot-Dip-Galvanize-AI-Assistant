import { describe, it, expect } from "vitest";
import { estimateLife } from "@/lib/tools/durability";
import { screenReactivity } from "@/lib/tools/steel-reactivity";

describe("estimateLife", () => {
  it("C1 (laju terendah = 0) → best case '>100', bukan Infinity", () => {
    const r = estimateLife({ coatingUm: 80, category: "C1" }) as { yearsRange: { best: unknown } };
    expect(r.yearsRange.best).toBe(">100");
    expect(Number.isFinite(r.yearsRange.best as unknown as number)).toBe(false);
  });

  it("selalu mengembalikan rentang (worst <= best secara laju konsumsi)", () => {
    const r = estimateLife({ coatingUm: 80, category: "C3" }) as { yearsRange: { worst: number } };
    expect(r.yearsRange.worst).toBeLessThanOrEqual(80 / 0.7);
  });

  it("config unverified dibawa ke output", () => {
    const r = estimateLife({ coatingUm: 80, category: "C2" }) as { unverified?: boolean };
    expect(r.unverified).toBe(true);
  });

  it("input tidak valid (category tidak dikenal) → error", () => {
    expect(() => estimateLife({ coatingUm: 80, category: "C99" })).toThrow();
  });
});

describe("screenReactivity", () => {
  it("Si equivalent di bawah 0.04 → LOW", () => {
    expect(screenReactivity({ siPct: 0.01 }).zone).toBe("LOW");
  });
  it("Si equivalent tepat 0.04 → SANDELIN (batas bawah inklusif)", () => {
    expect(screenReactivity({ siPct: 0.04 }).zone).toBe("SANDELIN");
  });
  it("Si equivalent tepat 0.15 → SANDELIN (batas atas inklusif)", () => {
    expect(screenReactivity({ siPct: 0.15 }).zone).toBe("SANDELIN");
  });
  it("Si equivalent tepat 0.22 → MODERATE (batas atas inklusif)", () => {
    expect(screenReactivity({ siPct: 0.22 }).zone).toBe("MODERATE");
  });
  it("di atas 0.22 → HIGH", () => {
    expect(screenReactivity({ siPct: 0.3 }).zone).toBe("HIGH");
  });
  it("fosfor dihitung dengan bobot 2.5x (Si + 2.5*P)", () => {
    const r = screenReactivity({ siPct: 0, pPct: 0.06 }); // 2.5 * 0.06 = 0.15
    expect(r.siEquivalent).toBeCloseTo(0.15);
    expect(r.zone).toBe("SANDELIN");
  });
  it("pPct opsional (default 0)", () => {
    expect(screenReactivity({ siPct: 0.01 }).siEquivalent).toBe(0.01);
  });
});
