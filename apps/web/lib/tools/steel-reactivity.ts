import { z } from "zod";
import cfg from "@galva/engineering-config/sandelin-reactivity.v1.json";
import { inRange } from "./coating-thickness/range";
import { propagateUnverified } from "./unverified";

export const ReactivityInput = z.object({
  siPct: z.number(),
  pPct: z.number().optional(),
});

export function screenReactivity(raw: unknown) {
  const { siPct, pPct = 0 } = ReactivityInput.parse(raw);
  const siEq = siPct + cfg.phosphorus_coefficient * pPct;

  let lowerBound = 0;
  const match = cfg.zones.find((z) => {
    const inZone = inRange(siEq, { min: lowerBound, min_incl: true, max: z.max_si_eq, max_incl: z.max_incl });
    lowerBound = z.max_si_eq ?? lowerBound;
    return inZone;
  });
  if (!match) {
    // Tidak boleh terjadi selama zones[] terakhir punya max_si_eq: null
    // (terbuka ke atas) -- tapi kalau config diedit sampai rusak, gagal
    // eksplisit daripada diam-diam memilih zona sembarangan.
    throw new Error(`Si-equivalent ${siEq} tidak masuk zona manapun di config -- periksa sandelin-reactivity.v1.json`);
  }

  const result: Record<string, unknown> = {
    siEquivalent: +siEq.toFixed(3),
    zone: match.zone,
    expectation: match.expectation,
    disclaimer: "Batas zona bersifat indikatif; suhu bath & paduan (mis. Ni) juga berpengaruh.",
  };
  propagateUnverified(result, cfg);
  return result;
}
