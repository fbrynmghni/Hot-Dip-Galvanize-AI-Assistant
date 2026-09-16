---
name: hdg-answer-eval
description: This skill should be used when the user asks to "tambah golden set", "evaluasi jawaban", "jalankan eval", "metrik faithfulness", "uji kualitas chat", "cek regresi jawaban", "citation accuracy", "standard mix-up", or works on eval/ directory. Mengatur cara mengukur kualitas jawaban GalvaAI.
version: 0.1.0
---

# Evaluasi Kualitas Jawaban

Chatbot yang terdengar meyakinkan tapi salah satu angka ketebalannya lebih
berbahaya daripada chatbot yang mengaku tidak tahu. Eval di sini bukan untuk
mengukur "seberapa bagus jawabannya", melainkan untuk menangkap kelas kesalahan
yang berkonsekuensi nyata: angka salah, standar tercampur, dan peringatan
keselamatan yang hilang.

## Format entri golden set

Setiap kasus memuat lebih dari sekadar pertanyaan dan jawaban ideal:

```yaml
- id: 11
  question: "Ketebalan minimum ASTM A123 untuk rolled WF beam, web 9 mm, flange 14 mm?"
  expected_standard: ASTM_A123
  expected_tool: check_coating_thickness
  expected_tool_input:
    materialCategory: STRUCTURAL_SHAPES
    steelThickness: 9          # bagian TERTIPIS (web), bukan flange
  must_include:
    - "Grade 100"
    - "individu minimal Grade 85"
    - "bagian paling tipis"
  must_not_include:
    - "ISO 1461"               # standar lain tidak boleh muncul sebagai angka
  requires_clarification: false
  safety_points: []
```

Field yang membedakan eval ini dari eval QA biasa:

- **`expected_tool` / `expected_tool_input`** — bukan cuma jawabannya benar,
  tapi angkanya benar-benar berasal dari tool dengan input yang benar. Jawaban
  benar dari tebakan model tetap dihitung gagal.
- **`requires_clarification`** — sebagian kasus **harus** dijawab dengan
  pertanyaan balik, bukan jawaban. Pertanyaan "berapa ketebalan minimum untuk
  plat 8 mm?" tanpa standar: jawaban langsung adalah kegagalan, walaupun
  angkanya kebetulan cocok dengan salah satu standar.
- **`must_not_include`** — menangkap pencampuran standar.
- **`safety_points`** — poin keselamatan yang wajib muncul (venting,
  embrittlement).

## Metrik & target

| Metrik | Definisi | Target |
|---|---|---|
| Faithfulness | Jawaban didukung konteks yang diambil | ≥ 0,9 |
| Citation accuracy | Link yang disitasi benar-benar relevan | ≥ 0,9 |
| **Numeric correctness** | Setiap angka = output tool / nilai standar | **100%** |
| **Standard mix-up rate** | Angka antar standar tercampur tanpa label | **0%** |
| **Safety recall** | Venting/embrittlement disebut saat relevan | **100%** |
| Review manual | Sampel chat direview engineer | 30/minggu |

Tiga metrik bercetak tebal tidak punya toleransi. Bukan karena ambisius, tapi
karena satu kegagalannya berarti satu keputusan inspeksi yang salah.

## Cara mengukur numeric correctness

Jangan mengukur dengan LLM-judge yang menilai apakah angkanya "terlihat benar".
Ambil angka dari jawaban, lalu bandingkan dengan output tool deterministik untuk
input yang sama:

1. Ekstrak setiap angka bersatuan dari jawaban (µm, mils, g/m², tahun).
2. Panggil tool yang relevan dengan input dari kasus eval.
3. Bandingkan. Selisih apa pun = gagal.
4. Angka yang muncul di jawaban tapi tidak ada padanannya di output tool = gagal
   (model mengarang).

LLM-judge dipakai untuk faithfulness, citation relevance, dan safety recall —
bukan untuk angka.

## Kapan golden set wajib ditambah

Ini kontrak dua arah dengan skill lain. Golden set bertambah **setiap kali**:

- **Tabel standar berubah** (skill `hdg-standards-config`) — satu kasus per sel
  yang berubah nilainya. Revisi ASTM A123 2024 memindahkan Plate 10 mm dari
  Grade 100 ke 75; tanpa kasus eval, regresi ke angka lama tidak terdeteksi.
- **Aturan system prompt berubah** (skill `hdg-chat-guardrails`) — satu kasus
  yang gagal bila aturan itu hilang. Aturan tanpa test akan terhapus diam-diam
  di revisi berikutnya.
- **Tool baru ditambah** (skill `hdg-engineering-tool`) — kasus yang memverifikasi
  tool itu benar-benar terpanggil, bukan dijawab dari ingatan model.
- **Ditemukan jawaban salah di produksi** — sebelum memperbaikinya, tulis
  kasusnya dulu.

Target ≥ 150 kasus; 20 kasus awal ada di `references/golden-set.md`.

## Menjalankan eval

Letakkan di `eval/`. Jalankan pada setiap perubahan prompt, config standar, atau
tool — bukan hanya sebelum rilis. Laporan mencantumkan skor per metrik plus
**daftar kasus yang gagal beserta diff angka**, karena itulah yang bisa
ditindaklanjuti.

## Referensi

- **`references/golden-set.md`** — 20 kasus awal, siap ditumbuhkan.
- **`references/metrics.md`** — definisi rinci tiap metrik, cara hitung, dan
  format laporan.
