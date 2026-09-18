import { describe, it, expect } from "vitest";
import { tokenize, bm25Scores } from "@/lib/rag/bm25";

describe("tokenize", () => {
  it("keeps standard designators as exact tokens", () => {
    expect(tokenize("what does ASTM A123 require")).toContain("a123");
  });

  it("keeps multi-word exact tokens like AS/NZS 4680 together", () => {
    const tokens = tokenize("compare to AS/NZS 4680 please");
    expect(tokens).toContain("as/nzs 4680");
  });

  it("matches the longer exact token A123M instead of being swallowed by A123", () => {
    // Regression: matching "a123" before "a123m" would consume the "a123"
    // substring first, leaving a stray "m" and never producing "a123m".
    const tokens = tokenize("per ASTM A123M this applies");
    expect(tokens).toContain("a123m");
    expect(tokens).not.toContain("m");
  });

  it("lowercases and splits generic words on punctuation", () => {
    expect(tokenize("Wet-Storage Stain!")).toEqual(
      expect.arrayContaining(["wet", "storage", "stain"]),
    );
  });
});

describe("bm25Scores", () => {
  const docs = [
    { id: "d1", tokens: tokenize("ASTM A123 requires Grade 100 for structural shapes") },
    { id: "d2", tokens: tokenize("ISO 1461 sets a mean minimum of 85 micrometers") },
    { id: "d3", tokens: tokenize("Wet storage stain is caused by poor ventilation during transport") },
  ];

  it("ranks the doc containing the exact standard token highest", () => {
    const scores = bm25Scores("what does A123 require for structural shapes", docs);
    const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]);
    expect(ranked[0][0]).toBe("d1");
  });

  it("gives zero score to docs with no query term overlap", () => {
    const scores = bm25Scores("wet storage stain ventilation", docs);
    expect(scores.get("d2")).toBe(0);
  });

  it("returns all zeros for an empty corpus without throwing", () => {
    const scores = bm25Scores("anything", []);
    expect(scores.size).toBe(0);
  });

  it("returns all zeros when the query has no terms", () => {
    const scores = bm25Scores("", docs);
    expect([...scores.values()].every((s) => s === 0)).toBe(true);
  });
});
