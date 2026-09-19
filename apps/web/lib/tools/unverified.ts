/**
 * Setiap tool membaca config yang bisa saja belum diverifikasi (lihat
 * CLAUDE.md aturan #5 dan skill hdg-standards-config). Helper ini adalah
 * satu-satunya tempat aturan "flag unverified config wajib dibawa ke output
 * tool" diterapkan, dipakai oleh semua tool yang membaca packages/engineering-config.
 */
export function propagateUnverified(
  result: Record<string, unknown>,
  cfg: { unverified?: boolean },
): void {
  if (cfg.unverified) result.unverified = true;
}
