import { ThicknessInput } from "./schema";
import { checkAstmA123 } from "./astm-a123";
import { checkIsoFamily } from "./iso-family";

export function checkCoatingThickness(raw: unknown) {
  const input = ThicknessInput.parse(raw);
  switch (input.standard) {
    case "ASTM_A123":
      return checkAstmA123(input);
    case "ISO1461":
    case "ASNZS4680":
      return checkIsoFamily(input);
  }
}
