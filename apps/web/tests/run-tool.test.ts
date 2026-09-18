import { describe, it, expect } from "vitest";
import { runTool } from "@/lib/llm/run-tool";

describe("runTool", () => {
  it("returns an error object for an unknown tool name instead of throwing", async () => {
    const result = (await runTool("does_not_exist", {})) as { error: string };
    expect(result.error).toMatch(/tidak dikenal/);
  });

  it("dispatches to a real tool and returns its result", async () => {
    const result = (await runTool("screen_steel_reactivity", { siPct: 0.01 })) as { zone: string };
    expect(result.zone).toBe("LOW");
  });

  it("passes Zod validation errors through as-is, not a generic message", async () => {
    const result = (await runTool("estimate_durability", { coatingUm: 80 })) as { error: string };
    // Zod's message should mention the missing field, not a generic string --
    // this is what lets the model ask the user instead of guessing.
    expect(result.error.toLowerCase()).toContain("category");
  });

  it("search_knowledge rejects a missing query with a clear error", async () => {
    const result = (await runTool("search_knowledge", {})) as { error: string };
    expect(result.error).toMatch(/query wajib/);
  });
});
