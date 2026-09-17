import { z } from "zod";

export const ReactivityInput = z.object({
  siPct: z.number(),
  pPct: z.number().optional(),
});

export function screenReactivity(raw: unknown) {
  const { siPct, pPct = 0 } = ReactivityInput.parse(raw);
  const siEq = siPct + 2.5 * pPct;
  let zone: string, expectation: string;
  if (siEq < 0.04) {
    zone = "LOW";
    expectation = "Coating relatif tipis & mengkilap";
  } else if (siEq <= 0.15) {
    zone = "SANDELIN";
    expectation = "Sangat reaktif: tebal, kusam, risiko getas";
  } else if (siEq <= 0.22) {
    zone = "MODERATE";
    expectation = "Reaktivitas terkendali";
  } else {
    zone = "HIGH";
    expectation = "Tebal, abu-abu matte";
  }
  return {
    siEquivalent: +siEq.toFixed(3),
    zone,
    expectation,
    disclaimer: "Batas zona bersifat indikatif; suhu bath & paduan (mis. Ni) juga berpengaruh.",
  };
}
