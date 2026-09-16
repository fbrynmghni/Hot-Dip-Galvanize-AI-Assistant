import { ToolNameInput, type ToolNameInputT } from "./schema";
// import cfg from "@galva/engineering-config/<standar>.v1.json";

/**
 * Pure function: tanpa I/O, tanpa network, tanpa Date.now().
 * Semua angka dibaca dari packages/engineering-config/ — jangan hardcode.
 */
export function runToolName(raw: unknown) {
  const input: ToolNameInputT = ToolNameInput.parse(raw);

  // 1. Cari baris tabel yang cocok memakai helper inRange (lib/tools/coating-thickness/range.ts).
  // 2. Bila tidak ada baris yang cocok atau nilainya null:
  //      return { verdict: "NOT_DEFINED", note: "<arahan konkret ke standar lain>" };
  //    Jangan interpolasi, jangan pakai baris terdekat.
  // 3. Susun hasil.

  const result: Record<string, unknown> = {
    // standard: `${cfg.standard} (${cfg.edition})`,   // label standar WAJIB ikut
    input,
  };

  // if (cfg.unverified) result.unverified = true;
  return result;
}
