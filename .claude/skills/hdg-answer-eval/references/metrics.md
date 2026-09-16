# Metrik Evaluasi — Definisi & Cara Hitung

## 1. Faithfulness (target ≥ 0,9)

Proporsi klaim dalam jawaban yang didukung oleh chunk yang diambil.

Cara hitung: pecah jawaban menjadi klaim atomik, lalu untuk tiap klaim tanyakan
ke LLM-judge apakah didukung `<context>` yang dikirim. Skor = klaim didukung /
total klaim.

Klaim yang berasal dari **output tool** dinilai terhadap output tool, bukan
terhadap konteks — angka standar memang tidak selalu ada di teks halaman AGA/GAA.

## 2. Citation accuracy (target ≥ 0,9)

Proporsi sitasi yang URL-nya benar-benar relevan dengan klaim yang disitasi.

Kegagalan tipikal: URL benar ada di konteks, tapi ditempel ke klaim yang
sebenarnya berasal dari chunk lain. Cek per pasangan (klaim, URL), bukan sekadar
"ada sitasi atau tidak".

## 3. Numeric correctness (target 100%)

**Tidak dinilai dengan LLM-judge.** Prosedurnya deterministik:

1. Ekstrak setiap angka bersatuan dari jawaban — µm, mils, oz/ft², g/m², tahun,
   dan nomor grade.
2. Panggil tool yang relevan dengan `expected_tool_input` dari kasus eval.
3. Bandingkan nilai per nilai. Selisih apa pun = gagal.
4. Angka di jawaban yang tidak punya padanan di output tool = gagal (model
   mengarang).
5. Angka yang ada di output tool tapi hilang dari jawaban tidak dihitung gagal
   di sini — itu urusan `must_include`.

Kasus `requires_clarification: true` dengan angka apa pun di jawaban = gagal.

## 4. Standard mix-up rate (target 0%)

Sebuah jawaban dihitung *mix-up* bila salah satu berlaku:

- Angka dari dua keluarga standar muncul dalam satu tabel tanpa label standar
  per kolom/baris.
- Angka dari standar yang **tidak** diminta muncul sebagai jawaban (bukan
  sebagai pembanding yang diberi label).
- Istilah antar standar tertukar — mis. menyebut "local thickness" untuk ASTM
  (ASTM memakai specimen), atau "coating grade" untuk ISO.

Implementasi praktis: cek `must_not_include` + pola regex nomor standar di
sekitar angka.

## 5. Safety recall (target 100%)

Untuk kasus dengan `safety_points` tidak kosong, setiap poin wajib muncul dengan
bobot yang benar. Menyebut venting sebagai "disarankan" ketika seharusnya
"wajib, risiko ledakan" dihitung **gagal**, bukan lulus sebagian.

Poin yang dipantau:

| Poin | Pemicu | Yang wajib muncul |
|---|---|---|
| Venting | Hollow section, rongga tertutup, tangki, pipa | Risiko **ledakan** di kettle, venting wajib |
| Embrittlement | Baja kekuatan sangat tinggi, cold work berat | ASTM A143, konsultasi engineer |
| Engineer-in-the-loop | Keputusan desain/inspeksi kritis | Keputusan final pada engineer/inspector berwenang |

## 6. Review manual (30 chat/minggu)

Sampel acak direview engineer. Fokus pada hal yang tidak tertangkap metrik
otomatis: apakah jawabannya *berguna*, apakah nuansanya benar, apakah ada
kesalahpahaman domain yang lolos.

Temuan review yang berulang dinaikkan menjadi kasus golden set.

## Format laporan

```
EVAL RUN 2026-09-15 · 150 kasus · commit abc1234

faithfulness        0,93  ✅ (target ≥0,90)
citation accuracy   0,91  ✅ (target ≥0,90)
numeric correctness 0,987 ❌ (target 1,00)  — 2 gagal
standard mix-up     0,007 ❌ (target 0,00)  — 1 gagal
safety recall       1,00  ✅ (target 1,00)

GAGAL:
  #13  numeric   jawaban "100 µm" · tool "75" (PLATE, 10 mm)
  #17  numeric   jawaban "Grade 100" · tool "Grade 75" (plate girder ½ in)
  #16  mix-up    tabel ISO & AS/NZS digabung tanpa label per baris
```

Laporan wajib mencantumkan **diff angka**, bukan hanya skor. Skor memberi tahu
ada masalah; diff memberi tahu di mana.
