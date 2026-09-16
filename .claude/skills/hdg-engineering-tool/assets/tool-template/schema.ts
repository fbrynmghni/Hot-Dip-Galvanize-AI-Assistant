import { z } from "zod";

/**
 * Skema input tool. Gunakan z.discriminatedUnion bila field wajib berbeda
 * per varian (mis. per standar) — jangan jadikan field opsional di satu
 * objek datar, karena input tak lengkap akan lolos ke dalam logika dan LLM
 * tidak mendapat pesan error yang berguna.
 */
export const ToolNameInput = z.object({
  // contoh:
  // steelThicknessMm: z.number().positive().max(300),
});

export type ToolNameInputT = z.infer<typeof ToolNameInput>;
