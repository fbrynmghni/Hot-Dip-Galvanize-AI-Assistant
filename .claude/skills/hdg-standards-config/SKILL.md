---
name: hdg-standards-config
description: This skill should be used when the user asks to "tambah standar", "update tabel ASTM", "verifikasi edisi standar", "ubah angka grade", "perbaiki batas ketebalan", "tambah kategori material", "update config engineering", or mentions ASTM A123/A123M, ASTM A153, ISO 1461, AS/NZS 4680, ISO 9223, coating grade, atau file di packages/engineering-config/. Mengatur prosedur wajib saat menyentuh angka standar HDG.
version: 0.1.0
---

# Tabel Standar HDG — Verifikasi & Konfigurasi

Angka ketebalan coating adalah *engineering deliverable*, bukan konten. Satu angka
salah di file config berujung pada sengketa inspeksi di lapangan: produk yang
sebenarnya lolos ditolak, atau produk yang gagal diterima. Skill ini mengatur
bagaimana angka standar masuk, berubah, dan diverifikasi di GalvaAI.

## Aturan tak bisa ditawar

**1. Urutan kerja: verifikasi → test → config.**

Tidak pernah terbalik. Saat sebuah angka atau batas berubah:

1. Verifikasi ke **dokumen standar asli** yang dimiliki secara sah (ASTM/ISO/AS-NZS
   yang dibeli, atau artikel resmi AGA/GAA untuk ringkasan revisi). Catat edisi
   persisnya.
2. Update/ tambah **unit test titik batas** yang mencerminkan angka baru. Test
   harus gagal dulu.
3. Baru ubah file config sampai test hijau.

Alasannya: menulis config lebih dulu membuat test ditulis untuk mencocokkan kode,
bukan mencocokkan standar — dan kesalahan jadi ter-lock-in dengan test yang
"hijau tapi salah".

**2. Satu file config = satu standar. Selamanya.**

Jangan pernah menggabungkan ISO 1461 dan AS/NZS 4680 walau tabelnya terlihat
identik. Batas di 1,5 mm berbeda:

- ISO 1461: `≥ 1,5 mm` masuk kelas **45/55**
- AS/NZS 4680: `≤ 1,5 mm` masuk kelas **35/45**

Baja tepat 1,5 mm memberi jawaban berbeda antar kedua standar. Menggabungkan
tabel menghapus perbedaan ini secara diam-diam.

**3. Setiap batas rentang ditulis eksplisit.**

Setiap baris rentang wajib punya `min`, `min_incl`, `max`, `max_incl`. Tidak ada
batas implisit, tidak ada asumsi "pasti inklusif". `max: null` berarti tak
terbatas ke atas.

**4. Metadata verifikasi wajib terisi.**

Setiap file config wajib punya:

```json
{ "edition": "A123/A123M-24", "verified_by": "NAMA_ENGINEER", "verified_at": "YYYY-MM-DD" }
```

Config dengan salah satu field masih placeholder = **blocker rilis**, bukan TODO.
Selama belum terverifikasi, tool yang membacanya wajib menyertakan flag
`unverified: true` di outputnya dan UI menampilkan peringatan. Jangan pernah
diam-diam menyajikan angka yang belum dicek sebagai fakta.

**5. Sel kosong bukan izin menebak.**

"—" di Table 1 ASTM A123 berarti standar tidak menetapkan persyaratan untuk
kombinasi kategori × rentang itu. Tool mengembalikan `verdict: "NOT_DEFINED"`
beserta arahan (cek ulang kategori per Appendix X1.1, atau rujuk ASTM A153 /
A767). Tidak boleh ada interpolasi, ekstrapolasi, atau "pakai yang terdekat".

**6. Jangan memuat teks standar secara utuh.**

Teks ASTM/ISO/AS-NZS berhak cipta. Yang disimpan hanya nilai numerik yang
diperlukan tool, plus rujukan nomor tabel/klausul. Lihat
`../hdg-rag-ingest/references/legal.md`.

## Prosedur: menambah standar baru

1. Buat `packages/engineering-config/<standar>.v1.json` — satu file, satu standar.
2. Tentukan bentuk input yang membedakan standar ini. ASTM A123 butuh **kategori
   material + tebal terukur**; ISO/AS-NZS cukup **tebal** (+ flag casting). Bentuk
   input yang berbeda berarti cabang baru di `discriminatedUnion` skema Zod, bukan
   field opsional yang ditambal ke cabang lama.
3. Tulis test titik batas untuk setiap boundary di tabel baru.
4. Implementasi pembacaan tabel (lihat skill `hdg-engineering-tool`).
5. Tambahkan opsi di Standard Selector UI dan di enum tool definition Claude.
6. Tambah kasus golden set yang membedakan standar baru dari yang lama —
   idealnya kasus di titik batas yang jawabannya berbeda (lihat skill
   `hdg-answer-eval`).

## Prosedur: update edisi standar

Revisi standar mengubah angka secara senyap. Revisi ASTM A123 2024, misalnya,
memisahkan **Plate** dari **Structural Shapes** — baja 10 mm yang tadinya
Grade 100 kini Grade 75 bila berupa plate. Jawaban lama tidak menjadi "kurang
akurat"; jawaban lama menjadi **salah**.

1. Bandingkan edisi lama vs baru, catat setiap sel yang berubah.
2. Naikkan versi file: `astm-a123.v2.json` — **jangan timpa v1**. Config lama
   tetap ada supaya hasil inspeksi historis bisa direproduksi.
3. Update `edition`, `verified_by`, `verified_at`.
4. Update test boundary; tambah test yang secara eksplisit mengunci perubahan
   (mis. "plate 10 mm → 75, bukan 100").
5. Beri metadata `supersedes` pada chunk RAG dari artikel edisi lama supaya
   retrieval tidak menarik angka usang (lihat skill `hdg-rag-ingest`).
6. Tambah kasus golden set untuk setiap sel yang berubah.

## Titik batas yang wajib punya test

Salah kelas di titik-titik ini adalah sumber sengketa inspeksi paling sering.
Setiap nilai berikut wajib punya test eksplisit:

| Standar | Titik batas (mm) |
|---|---|
| ASTM A123/A123M | 1,6 · 3,2 · 4,8 · 6,4 · 16,0 |
| ASTM A123 (imperial) | 1/16 · 1/8 · 3/16 · 1/4 · 5/8 in |
| ISO 1461 | 1,5 · 3,0 · 6,0 |
| AS/NZS 4680 | 1,5 · 3,0 · 6,0 |

## Referensi

Muat sesuai kebutuhan — jangan salin isinya ke file lain:

- **`references/astm-a123.md`** — Table 1 (7 kategori × 6 rentang), Table 2
  konversi grade, aturan penerimaan edisi 2024, Appendix X1.1 (penentuan
  kategori) & X1.2 (tebal terukur).
- **`references/iso-asnzs.md`** — tabel ISO 1461 (termasuk casting) dan
  AS/NZS 4680, aturan local vs mean, perbedaan batas 1,5 mm.
- **`references/iso9223.md`** — kategori korosivitas C1–CX, laju korosi zinc,
  catatan definisi AGA *time to first maintenance*.
- **`references/verification-checklist.md`** — checklist yang diisi engineer
  saat memverifikasi satu standar ke edisi tertentu.

## Aset

`assets/*.json` berisi empat file config awal dengan `verified_by` dan
`verified_at` **sengaja dikosongkan**. Salin ke
`packages/engineering-config/` saat scaffolding, lalu isi metadata verifikasi
sebelum rilis.
