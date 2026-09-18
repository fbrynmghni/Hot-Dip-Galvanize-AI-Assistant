import { z } from "zod";

const Readings = z.array(z.array(z.number().nonnegative()).min(1)).min(1);
// ASTM   -> array per specimen,       isi = pembacaan dalam specimen tsb
// ISO/AS -> array per reference area, isi = pembacaan dalam area tsb

// Satu-satunya sumber kebenaran untuk 7 kategori material ASTM A123 --
// dipakai juga oleh compare.ts dan route handler /api/tools. Menambah
// kategori baru (lihat hdg-standards-config "Prosedur: menambah standar
// baru") berarti mengubah di sini saja.
export const MATERIAL_CATEGORIES = [
  "STRUCTURAL_SHAPES",
  "STRIP_BAR",
  "PLATE",
  "PIPE_TUBING",
  "WIRE",
  "REINFORCING_BAR",
  "FORGINGS_CASTINGS",
] as const;

export type MaterialCategory = (typeof MATERIAL_CATEGORIES)[number];

export const ThicknessInput = z.discriminatedUnion("standard", [
  z.object({
    standard: z.literal("ASTM_A123"),
    materialCategory: z.enum(MATERIAL_CATEGORIES),
    steelThickness: z.number().positive(),
    unit: z.enum(["mm", "in"]).default("mm"),
    readingsUm: Readings.optional(),
  }),
  z.object({
    standard: z.literal("ISO1461"),
    steelThicknessMm: z.number().positive().max(300),
    isCasting: z.boolean().default(false),
    readingsUm: Readings.optional(),
  }),
  z.object({
    standard: z.literal("ASNZS4680"),
    steelThicknessMm: z.number().positive().max(300),
    // Field ini ADA di schema (bukan dihilangkan) justru supaya isCasting:true
    // untuk AS/NZS 4680 tidak di-strip diam-diam oleh Zod dan diam-diam
    // dijawab pakai tabel non-casting -- lihat iso-family.ts, yang menolak
    // eksplisit dengan NOT_DEFINED karena tabel casting AS/NZS 4680 belum
    // ada di config.
    isCasting: z.boolean().default(false),
    readingsUm: Readings.optional(),
  }),
]);

export type ThicknessInputT = z.infer<typeof ThicknessInput>;
