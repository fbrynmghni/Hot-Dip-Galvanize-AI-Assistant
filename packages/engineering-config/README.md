# @galva-ai/engineering-config

Tabel standar HDG sebagai JSON versioned. **Jangan edit file di sini tanpa
mengikuti prosedur di `.claude/skills/hdg-standards-config/`** — urutan
kerjanya wajib verifikasi → update test titik batas → baru ubah file di sini.

Setiap file punya field `unverified` yang wajib dibawa tool sampai ke output
selama `verified_by`/`verified_at` masih kosong. Lihat sitasi sumber di
`.claude/skills/hdg-standards-config/references/`.

File di direktori ini adalah salinan kerja dari
`.claude/skills/hdg-standards-config/assets/` — begitu ada revisi edisi
standar, tambah file `<standar>.v2.json` baru, jangan timpa `v1`.
