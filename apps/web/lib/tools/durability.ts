import { z } from "zod";
import zincRates from "@galva/engineering-config/iso9223-zinc.v1.json";
import { propagateUnverified } from "./unverified";

export const DurabilityInput = z.object({
  coatingUm: z.number().positive(),
  category: z.enum(["C1", "C2", "C3", "C4", "C5", "CX"]),
});

export function estimateLife(raw: unknown) {
  const { coatingUm, category } = DurabilityInput.parse(raw);
  const [lo, hi] = zincRates.rates[category];
  const best = lo === 0 ? Infinity : coatingUm / lo;
  const worst = coatingUm / hi;
  const result: Record<string, unknown> = {
    category,
    yearsRange: {
      worst: Math.round(worst),
      best: Number.isFinite(best) ? Math.round(best) : ">100",
    },
    method: "Linear consumption (ISO 9223 zinc rates) — estimasi kasar",
    recommend: "Untuk proyek nyata gunakan GAA Durability Estimator / AGA LCCC dan data lokasi.",
  };
  propagateUnverified(result, zincRates);
  return result;
}
