---
name: hdg-content-writer
description: This skill should be used when the user asks to "tulis artikel /learn", "buat halaman knowledge hub", "isi glosarium", "tulis FAQ", "jelaskan lapisan zeta", "konten halaman inspeksi", "halaman durability", "tulis penjelasan proses galvanis", or works on app/(hub)/learn/, /glossary, atau /sources. Menulis konten knowledge hub GalvaAI yang akurat, bersitasi, dan aman secara hak cipta.
version: 0.1.0
---

# Menulis Konten Knowledge Hub

Halaman `/learn` bukan blog. Pembacanya structural engineer yang sedang
menyusun spesifikasi, QC inspector yang sedang memutuskan terima/tolak, dan
fabricator yang sedang mendesain venting. Satu kalimat yang salah bisa dipakai
sebagai dasar keputusan.

## Aturan hak cipta saat menulis

Sumbernya konten berhak cipta milik asosiasi. Aturan lengkap ada di
`../hdg-rag-ingest/references/legal.md` (canonical). Yang paling sering kena
saat menulis:

- **Parafrase dengan bahasa sendiri.** Jangan menyalin paragraf AGA/GAA, walau
  dengan atribusi. Halaman tidak ditampilkan ulang secara utuh.
- **Kutipan langsung dibatasi** dan selalu ditautkan ke sumbernya.
- **Teks standar ASTM/ISO/AS-NZS tidak dimuat utuh.** Boleh menyebut nilai yang
  relevan dan nomor tabel/klausulnya, bukan menyalin teks klausul.
- **Kalkulator AGA/GAA dirujuk via link**, tidak di-clone.
- **Logo & merek tidak dipakai.** Jangan membuat kesan afiliasi resmi.

## Angka di halaman konten berasal dari config, bukan diketik manual

Setiap angka ketebalan, grade, atau laju korosi yang muncul di halaman konten
diambil dari `packages/engineering-config/` — idealnya dirender dari sumber yang
sama dengan kalkulator, bukan ditulis sebagai teks statis.

Alasannya: saat config dinaikkan versinya setelah revisi standar, halaman
konten yang angkanya diketik manual akan diam-diam menjadi salah, dan tidak ada
test yang menangkapnya. Revisi ASTM A123 2024 memindahkan Plate 10 mm dari
Grade 100 ke 75 — halaman lama yang menulis "100" tetap terlihat baik-baik saja.

Bila sebuah angka memang harus muncul sebagai teks, sertakan nomor edisi
standar di kalimat yang sama.

## Gaya bilingual

Narasi Bahasa Indonesia; istilah teknis tetap Inggris karena itulah yang muncul
di spesifikasi proyek, PO, dan laporan inspeksi. Di penyebutan pertama, beri
penjelasan singkat lalu tautkan ke `/glossary`:

> Bercak putih yang muncul saat material disimpan lembap tanpa sirkulasi udara
> disebut **wet storage stain** (sering juga disebut *white rust*) — noda produk
> korosi zinc awal, yang pada tingkat ringan umumnya bukan alasan penolakan.

Jangan menerjemahkan nomor standar, nama fase (Gamma/Delta/Zeta/Eta), atau nama
efek (Sandelin).

## Checklist per halaman

Sebelum sebuah halaman dianggap selesai:

- [ ] Setiap klaim teknis punya sitasi `[AGA]` / `[GAA]` + URL
- [ ] Tidak ada angka ASTM dan ISO/AS-NZS dalam satu tabel tanpa label standar
- [ ] Angka diambil dari config, bukan diketik manual; edisi standar disebut
- [ ] Istilah teknis tertaut ke `/glossary` di penyebutan pertama
- [ ] Poin keselamatan disebut bila relevan — terutama **venting** (rongga
      tertutup tanpa vent dapat meledak di kettle) dan **embrittlement**
      (ASTM A143) pada baja kekuatan sangat tinggi
- [ ] Hal yang sering disalahpahami dinyatakan eksplisit, bukan diasumsikan
      diketahui — mis. coating abu-abu kusam **bukan** cacat selama ketebalan
      dan adhesi memenuhi spesifikasi
- [ ] Disclaimer edukatif ada di footer
- [ ] Tidak ada paragraf yang merupakan salinan sumber

## Nada

Menulis seperti engineer yang menjelaskan ke rekan, bukan seperti brosur.
Sebut batasannya. Bila sesuatu bergantung pada standar atau kategori material,
katakan bergantung — jangan memberi satu angka yang terkesan universal.

Hindari menyatakan verdict terima/tolak sebagai aturan umum. Kriteria
penerimaan bergantung pada standar yang dipakai, dan keputusan final ada pada
inspector berwenang.

## Referensi

- **`references/domain-knowledge.md`** — fondasi domain: proses 9 tahap,
  metalurgi lapisan Γ/δ/ζ/η, kimia baja & Sandelin, design for HDG, inspeksi &
  kriteria penerimaan, post-galvanizing, troubleshooting matrix. Basis materi
  untuk hampir semua halaman `/learn`.
- **`references/site-map.md`** — struktur halaman knowledge hub, komponen UI
  chat & kalkulator, dan persona pembaca per halaman.
- **`references/glossary.md`** — glosarium EN↔ID dan tabel konversi satuan.

Untuk angka standar, jangan pakai ingatan — muat
`../hdg-standards-config/references/`.
