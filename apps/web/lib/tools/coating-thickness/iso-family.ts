import iso1461 from "@galva/engineering-config/iso1461.v1.json";
import asnzs4680 from "@galva/engineering-config/asnzs4680.v1.json";
import { inRange, mean, round1, type Range } from "./range";
import { propagateUnverified } from "../unverified";

export function checkIsoFamily(input: {
  standard: "ISO1461" | "ASNZS4680";
  steelThicknessMm: number;
  isCasting?: boolean;
  readingsUm?: number[][];
}) {
  type ThicknessRow = Range & { local_um: number; mean_um: number };
  const cfg = input.standard === "ISO1461" ? iso1461 : asnzs4680;
  const table = (
    input.isCasting && "castings" in cfg ? cfg.castings : cfg.rows
  ) as ThicknessRow[];
  const row = table.find((r) => inRange(input.steelThicknessMm, r));
  if (!row) throw new Error("Ketebalan baja di luar tabel");

  const result: Record<string, unknown> = {
    standard: `${cfg.standard} (${cfg.edition})`,
    requirement: { localMinUm: row.local_um, meanMinUm: row.mean_um },
  };

  if (input.readingsUm?.length) {
    const locals = input.readingsUm.map(mean); // local thickness per reference area
    const overallMean = mean(locals);
    const failingAreas = locals
      .map((v, i) => ({ area: i + 1, localUm: round1(v) }))
      .filter((a) => a.localUm < row.local_um);

    const localPass = failingAreas.length === 0;
    const meanPass = overallMean >= row.mean_um;

    result.measured = { localThicknessesUm: locals.map(round1), meanUm: round1(overallMean) };
    result.checks = { local: localPass ? "PASS" : "FAIL", mean: meanPass ? "PASS" : "FAIL" };
    result.failingAreas = failingAreas;
    result.verdict = localPass && meanPass ? "CONFORMS" : "NON_CONFORMING";
  }

  result.note =
    "Screening. Jumlah & ukuran reference area mengikuti klausul sampling standar. " +
    "Artikel yang di-centrifuge memakai tabel berbeda (belum didukung v1).";
  propagateUnverified(result, cfg);
  return result;
}
