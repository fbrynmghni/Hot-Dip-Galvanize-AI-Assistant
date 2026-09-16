# ASTM A123/A123M — Referensi Tabel & Aturan

> **Status verifikasi:** angka di bawah adalah nilai referensi dari edisi
> A123/A123M-24 sebagaimana dirangkum AGA. **Wajib diverifikasi** terhadap
> dokumen ASTM asli yang dimiliki secara sah sebelum dipakai di produksi.
> Sumber ringkasan: https://galvanizeit.org/knowledgebase/article/2024-revision-of-astm-a123

## Table 1 — Minimum Average Coating Thickness Grade by Material Category

Berlaku untuk **semua specimen yang diuji**, berdasarkan **tebal baja terukur**
(bukan nominal). Nilai dalam µm.

| Kategori material | < 1/16 in [< 1,6 mm] | 1/16 – < 1/8 in [1,6 – < 3,2 mm] | 1/8 – 3/16 in [3,2 – 4,8 mm] | > 3/16 – < 1/4 in [> 4,8 – < 6,4 mm] | 1/4 – < 5/8 in [6,4 – < 16,0 mm] | ≥ 5/8 in [≥ 16,0 mm] |
|---|---|---|---|---|---|---|
| **Structural Shapes** | 45 | 65 | 75 | 75 | 100 | 100 |
| **Strip and Bar** | 45 | 65 | 75 | 75 | 75 | 100 |
| **Plate** | 45 | 65 | 75 | 75 | 75 | 100 |
| **Pipe & Tubing** | 45 | 45 | 75 | 75 | 75 | 75 |
| **Wire** | 35 | 50 | 60 | 65 | 80 | 80 |
| **Reinforcing Bar** | — | — | — | — | 100 | 100 |
| **Forgings and Castings** | — | — | — | 100 | 100 | 100 |

`—` = tidak ada persyaratan untuk rentang tersebut. Tool wajib mengembalikan
`NOT_DEFINED`, bukan menebak.

### Inklusivitas batas

Tampilan tabel di halaman web AGA tidak menampilkan simbol ≥/≤ secara
konsisten. Batas yang dipakai di konfigurasi GalvaAI adalah interpretasi
konvensional berikut, dan **wajib dicek terhadap dokumen ASTM asli**:

| Rentang | Metric (mm) | Imperial (in) |
|---|---|---|
| R1 | `0 ≤ t < 1,6` | `0 ≤ t < 0,0625` |
| R2 | `1,6 ≤ t < 3,2` | `0,0625 ≤ t < 0,125` |
| R3 | `3,2 ≤ t ≤ 4,8` | `0,125 ≤ t ≤ 0,1875` |
| R4 | `4,8 < t < 6,4` | `0,1875 < t < 0,25` |
| R5 | `6,4 ≤ t < 16,0` | `0,25 ≤ t < 0,625` |
| R6 | `t ≥ 16,0` | `t ≥ 0,625` |

## Table 2 — Konversi Coating Grade

| Grade | mils | µm | oz/ft² | g/m² |
|---|---|---|---|---|
| 35 | 1,4 | 35 | 0,8 | 245 |
| 45 | 1,8 | 45 | 1,0 | 320 |
| 50 | 2,0 | 50 | 1,2 | 355 |
| 55 | 2,2 | 55 | 1,3 | 390 |
| 60 | 2,4 | 60 | 1,4 | 425 |
| 65 | 2,6 | 65 | 1,5 | 460 |
| 75 | 3,0 | 75 | 1,7 | 530 |
| 80 | 3,1 | 80 | 1,9 | 565 |
| 85 | 3,3 | 85 | 2,0 | 600 |
| 100 | 3,9 | 100 | 2,3 | 705 |

## Perubahan penting di edisi 2024

- **Plate dipisah dari Structural Shapes.** Plate 6,4 – < 16 mm kini **Grade 75**
  (sebelumnya 100); baru Grade 100 pada ≥ 16 mm.
- **Structural Shapes & Plate pada > 4,8 – < 6,4 mm** kini **Grade 75**
  (sebelumnya 85).
- **Rentang baru ≥ 5/8 in (16 mm).**
- **Kategori baru:** Reinforcing Bar, serta Forgings & Castings (untuk
  forging/casting yang tidak dapat diproses sesuai A153).

## Aturan penerimaan

- **Rata-rata semua specimen** harus ≥ grade dari Table 1.
- **Setiap specimen individual** minimal **satu grade di bawah** syarat Table 1,
  dan urutan "satu grade di bawah" diambil dari **Table 2**, bukan Table 1.
  Contoh: syarat Grade 100 → individu minimal **Grade 85**, walaupun angka 85
  tidak muncul di Table 1. Revisi 2024 menegaskan hal ini.
- **Tidak ada batas maksimum** ketebalan. Coating tebal tidak otomatis reject,
  kecuali mengganggu *intended use*, membuat permukaan tidak bisa mating, atau
  berbahaya saat handling.
- **Intended use** (def. 3.2.5) = fungsi produk, fit-up, dan kemampuan dicat /
  powder coat — **bukan tampilan**. Kekasaran ringan akibat dross, kondisi
  permukaan awal, atau reaktivitas baja bukan alasan reject.
- **AESS / duplex / estetika khusus** → kriteria tampilan disepakati
  galvanizer–pembeli dan ditulis di PO (6.4.1).
- **Masking** (def. 3.2.6): area yang di-masking **tidak** dihitung sebagai
  *accessible surface area*, sehingga batas luas repair (0,5% area atau 36 in²
  per short ton) dihitung tanpa area masking.
- **Re-galvanizing** tidak menjamin memperbaiki bare area akibat kesalahan
  desain/fabrikasi (Note 9) → patuhi A143, A384, A385.
- **Variasi kondisi permukaan awal** (pitting, cast surface, area machining)
  wajar menghasilkan ketebalan berbeda (Note 13).
- **Campuran baja reaktif & non-reaktif** dalam kategori dan rentang tebal yang
  sama → rencana aksi disepakati bersama; mengurangi waktu celup tidak menjamin
  hasil (Note 14, rujuk A385).
- Jumlah & distribusi titik ukur mengikuti klausul sampling A123 dan **ASTM E376**.
- Baut, mur, hardware kecil yang di-centrifuge → **ASTM A153**, bukan A123.

## Appendix X1.1 — Penentuan kategori material

Kategori ditentukan dari **cara produk dibuat**, bukan tampilan akhirnya.

| Produk | Kategori yang benar |
|---|---|
| Bar grating | Strip and Bar |
| Handrail | Pipe & Tubing |
| Rolled beam, rolled angle | Structural Shapes |
| Plate girder / beam dari plat | Plate |
| Angle dari plat yang dilas | Plate |
| Pole dari plat bending (bulat/poligonal) | Plate (bukan Pipe & Tubing) |

Dampaknya nyata: beam tebal terukur ½ in → rolled beam = **Grade 100**, tetapi
plate girder = **Grade 75**. Sebaliknya, pole dari plat 5/8 in = **Grade 100**,
bukan 75.

## Appendix X1.2 — Tebal baja

- Gunakan **tebal terukur**. Tebal nominal pipa/tube/plat bisa menghasilkan
  grade yang salah.
- Bila tebal sebelum galvanis tidak tersedia, boleh diukur setelah galvanis
  sebagai pendekatan; bila tidak dapat diakses, rujuk tebal nominal/gambar proyek.
- **Desain tapered** dan **structural shapes dengan flange/web/leg berbeda
  tebal** → pakai **bagian paling tipis**.
- **Expanded metal** → pakai tebal sheet terukur.

## Perbedaan kunci vs ISO 1461 / AS/NZS 4680

| Aspek | ASTM A123-24 | ISO 1461 / AS/NZS 4680 |
|---|---|---|
| Input penentu | Kategori material (7) + tebal terukur | Tebal baja (+ casting / centrifuged) |
| Output | Coating Grade (µm) | Local min & mean min (µm) |
| Batas ketebalan | Inci (A123) / mm (A123M), 6 rentang | mm, 4 rentang |
| Baja 10 mm | Structural shapes **100** · Plate **75** | **85** (mean) |
| Kriteria individu | 1 grade di bawah (urutan Table 2) | Nilai *local* per reference area |
| Batas maksimum | Tidak ada | Tidak ada (umumnya) |

**Contoh nyata:** baja 10 mm, rata-rata terukur 90 µm.

- ISO 1461 → **lolos** (≥ 85 µm).
- ASTM A123-24 **plate** → **lolos** (≥ 75 µm).
- ASTM A123-24 **rolled beam (structural shapes)** → **tidak lolos** (< 100 µm).

Satu produk bisa lolos atau gagal hanya karena standar dan kategori materialnya
berbeda. Karena itu GalvaAI tidak pernah menjawab pertanyaan ASTM A123 tanpa
tahu kategori materialnya.
