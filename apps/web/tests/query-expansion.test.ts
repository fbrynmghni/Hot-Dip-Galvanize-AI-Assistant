import { describe, it, expect } from "vitest";
import { expandQuery } from "@/lib/rag/query-expansion";

describe("expandQuery", () => {
  it("appends English terms for a known Indonesian phrase", () => {
    const expanded = expandQuery("kenapa hasil galvanis saya ada karat putih?");
    expect(expanded).toContain("karat putih");
    expect(expanded).toContain("wet storage stain");
  });

  it("does not modify a query with no matching phrase", () => {
    const q = "apa itu galvanizing";
    expect(expandQuery(q)).toBe(q);
  });

  it("matches case-insensitively", () => {
    expect(expandQuery("KARAT PUTIH di baja")).toContain("wet storage stain");
  });

  it("does not duplicate the original query text", () => {
    const expanded = expandQuery("lubang udara di tiang");
    expect(expanded.startsWith("lubang udara di tiang")).toBe(true);
  });
});
