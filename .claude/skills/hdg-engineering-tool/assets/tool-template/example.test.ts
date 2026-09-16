import { describe, it, expect } from "vitest";
import { runToolName } from "./index";

describe("<nama tool> — titik batas", () => {
  // Tulis test untuk SETIAP batas rentang di tabel, termasuk nilai tepat
  // di batas. Test ditulis sebelum implementasi dan harus gagal dulu.
  it.todo("tepat di batas bawah → kelas yang benar");
  it.todo("tepat di batas atas → kelas yang benar");
});

describe("<nama tool> — di luar cakupan", () => {
  it.todo("kombinasi yang tidak dicakup tabel → NOT_DEFINED dengan arahan");
});

describe("<nama tool> — validasi input", () => {
  it("input kosong → error", () => {
    expect(() => runToolName({ steelThicknessMm: -1 })).toThrow();
  });
});

describe("<nama tool> — kontrak output", () => {
  it.todo("hasil selalu membawa label standar + edisi");
  it.todo("config belum terverifikasi → flag unverified ikut di output");
});
