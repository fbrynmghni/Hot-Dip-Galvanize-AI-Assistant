/**
 * TOOL_IMPL[name](input) -- setiap tool menerima `unknown` dan memvalidasi
 * dirinya sendiri lewat Zod (lihat lib/tools/). Error (Zod atau Error biasa)
 * dikembalikan APA ADANYA ke model sebagai tool result, bukan ditelan jadi
 * pesan generik -- pesan Zod yang menyebut field hilang itulah yang memicu
 * model bertanya balik ke user alih-alih menebak.
 */

import { checkCoatingThickness } from "../tools/coating-thickness";
import { compareStandards } from "../tools/coating-thickness/compare";
import { estimateLife } from "../tools/durability";
import { screenReactivity } from "../tools/steel-reactivity";
import { retrieve } from "../rag/retrieve";

const TOOL_IMPL: Record<string, (input: unknown) => unknown> = {
  check_coating_thickness: checkCoatingThickness,
  compare_thickness_standards: compareStandards,
  estimate_durability: estimateLife,
  screen_steel_reactivity: screenReactivity,
  search_knowledge: async (input: unknown) => {
    const { query, standard } = input as { query?: unknown; standard?: unknown };
    if (typeof query !== "string" || query.trim() === "") {
      throw new Error("query wajib diisi (string, tidak boleh kosong).");
    }
    const mapped = standard === "ASTM" || standard === "ISO/ASNZS" ? standard : undefined;
    return retrieve(query, { standard: mapped });
  },
};

export async function runTool(name: string, input: unknown): Promise<unknown> {
  const impl = TOOL_IMPL[name];
  if (!impl) return { error: `Tool "${name}" tidak dikenal.` };
  try {
    return await impl(input);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
