import { z } from "zod";
import { checkCoatingThickness } from "./index";
import { MATERIAL_CATEGORIES } from "./schema";

export const CompareInput = z.object({
  steelThicknessMm: z.number().positive(),
  materialCategory: z.enum(MATERIAL_CATEGORIES),
});

export function compareStandards(raw: unknown) {
  const p = CompareInput.parse(raw);
  return {
    astmA123: checkCoatingThickness({
      standard: "ASTM_A123",
      materialCategory: p.materialCategory,
      steelThickness: p.steelThicknessMm,
      unit: "mm",
    }),
    iso1461: checkCoatingThickness({ standard: "ISO1461", steelThicknessMm: p.steelThicknessMm }),
    asnzs4680: checkCoatingThickness({
      standard: "ASNZS4680",
      steelThicknessMm: p.steelThicknessMm,
    }),
  };
}
