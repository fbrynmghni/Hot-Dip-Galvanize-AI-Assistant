import { describe, it, expect, beforeEach } from "vitest";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { retrieve } from "@/lib/rag/retrieve";

function writeChunk(dir: string, name: string, chunk: Record<string, unknown>) {
  writeFileSync(join(dir, `${name}.json`), JSON.stringify(chunk));
}

const ASTM_CHUNK = {
  source: "AGA",
  url: "https://galvanizeit.org/knowledgebase/article/2024-revision-of-astm-a123",
  title: "2024 Revision of ASTM A123",
  section: "Table 1",
  standard_family: "ASTM",
  topics: [],
  text: "ASTM A123 Table 1 sets Grade 75 for plate 6.4 to 16mm, revised from Grade 100.",
  content_hash: "hash-astm",
};

const ISO_CHUNK = {
  source: "AGA",
  url: "https://galvanizeit.org/knowledgebase/article/iso-1461",
  title: "ISO 1461",
  section: "Overview",
  standard_family: "ISO/ASNZS",
  topics: [],
  text: "ISO 1461 sets a mean minimum coating thickness of 85 micrometers for steel over 6mm.",
  content_hash: "hash-iso",
};

const GENERAL_CHUNK = {
  source: "AGA",
  url: "https://galvanizeit.org/knowledgebase/article/iso-1461-and-astm-a123",
  title: "ISO 1461 vs ASTM A123",
  section: "Comparison",
  standard_family: "general",
  topics: [],
  text: "Comparing ASTM A123 and ISO 1461 requirements for the same steel thickness.",
  content_hash: "hash-general",
};

describe("retrieve", () => {
  let cacheDir: string;

  beforeEach(() => {
    cacheDir = mkdtempSync(join(tmpdir(), "galva-retrieve-test-"));
  });

  it("returns no_context confidence when the cache directory doesn't exist", async () => {
    const result = await retrieve("coating thickness", { cacheDir: join(cacheDir, "does-not-exist") });
    expect(result.chunks).toEqual([]);
    expect(result.confidence).toBe("no_context");
  });

  it("returns no_context confidence when the cache directory is empty", async () => {
    const result = await retrieve("coating thickness", { cacheDir });
    expect(result.chunks).toEqual([]);
    expect(result.confidence).toBe("no_context");
  });

  it("finds the chunk whose text matches the query via BM25", async () => {
    writeChunk(cacheDir, "a", ASTM_CHUNK);
    writeChunk(cacheDir, "b", ISO_CHUNK);
    const result = await retrieve("ASTM A123 Grade 75 plate", { cacheDir });
    expect(result.chunks[0].content_hash).toBe("hash-astm");
  });

  it("filters to the requested standard_family but always keeps general chunks", async () => {
    writeChunk(cacheDir, "a", ASTM_CHUNK);
    writeChunk(cacheDir, "b", ISO_CHUNK);
    writeChunk(cacheDir, "c", GENERAL_CHUNK);
    const result = await retrieve("thickness requirement", { cacheDir, standard: "ASTM" });
    const families = result.chunks.map((c) => c.standard_family);
    expect(families).not.toContain("ISO/ASNZS");
    expect(families).toContain("general");
  });

  it("never returns a raw embedding field on retrieved chunks", async () => {
    writeChunk(cacheDir, "a", { ...ASTM_CHUNK, embedding: [0.1, 0.2, 0.3] });
    const result = await retrieve("ASTM A123 Grade 75", { cacheDir });
    expect(result.chunks[0]).not.toHaveProperty("embedding");
  });

  it("skips a malformed JSON file instead of crashing the whole retrieval", async () => {
    writeFileSync(join(cacheDir, "broken.json"), "{not valid json");
    writeChunk(cacheDir, "a", ASTM_CHUNK);
    const result = await retrieve("ASTM A123", { cacheDir });
    expect(result.chunks.length).toBe(1);
  });
});
