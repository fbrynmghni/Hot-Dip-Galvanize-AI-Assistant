# ISO 1461 & AS/NZS 4680 — Referensi Tabel & Aturan

> **Status verifikasi:** `unverified: true`. Nilai di bawah bersumber dari
> **artikel terbuka** (bukan teks standar berbayar) sesuai kebijakan proyek —
> lihat "Sumber" di tiap tabel. **Belum** diverifikasi terhadap edisi resmi
> yang dimiliki secara sah; `verified_by`/`verified_at` tetap kosong sampai itu
> terjadi. Boleh dipakai sebagai draft config dengan flag `unverified` yang
> dibawa sampai ke output tool.

Keduanya disimpan sebagai **file config terpisah**, bukan satu tabel bersama.
Lihat catatan batas 1,5 mm di bawah.

## ISO 1461 — artikel tidak di-centrifuge

**Sumber:** [UK Galvanizers Association — EN ISO 1461](https://galvanizing.org.uk/galvanizing-standards/iso-1461/)
(tabel local + mean lengkap, termasuk casting). Nilai mean saja juga muncul di
[AGA — ISO 1461](https://galvanizeit.org/knowledgebase/article/iso-1461) dan
konsisten untuk 3 dari 4 baris.

| Tebal baja | Local min (µm) | Mean min (µm) |
|---|---|---|
| > 6 mm | 70 | 85 |
| > 3 mm s/d ≤ 6 mm | 55 | 70 |
| ≥ 1,5 mm s/d ≤ 3 mm | 45 | 55 |
| < 1,5 mm | 35 | 45 |

> ⚠️ **Ambiguitas batas 1,5 mm — belum terselesaikan dari sumber terbuka.**
> Halaman UK Galvanizers Association menulis baris terbawah sebagai "steel
> **> 1,5 mm**" dengan nilai 35/45 µm — yang jelas typo (baris itu harus jadi
> pelengkap dari baris "≥ 1,5 s/d ≤ 3 mm" di atasnya, bukan tumpang tindih),
> jadi dibaca sebagai "< 1,5 mm". Sementara halaman AGA (yang eksplisit
> menyatakan dirinya tidak mereproduksi tabel ISO 1461 secara lengkap) memakai
> pola sebaliknya: `≤ 1,5 mm → 45`, `> 1,5 s/d ≤ 3 mm → 55` — pola AS/NZS 4680,
> bukan yang tertulis di sini. Dua sumber terbuka yang dicek **tidak
> sepenuhnya sepakat** persis di titik 1,5 mm. Tabel di atas dipertahankan
> (konsisten secara internal + didukung sumber yang lebih lengkap), TAPI titik
> batas 1,5 mm ini wajib jadi **test case eksplisit** yang ditandai
> "unconfirmed pending verifikasi teks ISO 1461 asli" — jangan biarkan lolos
> sebagai fakta ke jawaban chat tanpa disclaimer.

### ISO 1461 — casting

**Sumber:** [UK Galvanizers Association — EN ISO 1461](https://galvanizing.org.uk/galvanizing-standards/iso-1461/).

| Tebal baja | Local min (µm) | Mean min (µm) |
|---|---|---|
| ≥ 6 mm | 70 | 80 |
| < 6 mm | 60 | 70 |

### Edisi ISO 1461:2022 vs 2009 — belum dicek dampaknya ke tabel ini

[Widnes Galvanizing — Updates to ISO 1461](https://widnesgalvanising.co.uk/updates-to-iso-1461-and-how-they-affect-the-galvanizing-industry-and-customers/)
(Agustus 2022) menyebut revisi 2022 **tidak** mengubah metodologi tabel
ketebalan di atas, tapi menambah ketentuan baru untuk **baja ultra-low-reactive**
(Si ≤ 0,01% dan Al > 0,035%) dengan tebal > 3 mm: boleh pakai persyaratan
kategori tebal satu tingkat di bawahnya. Ini paralel dengan Note 14 di
`astm-a123.md` soal baja reaktif. **Belum ditambahkan ke config** — perlu
keputusan apakah GalvaAI v1 mendukung kasus ini atau menolaknya eksplisit
(`NOT_DEFINED` + arahan) seperti centrifuged article di bawah.

## AS/NZS 4680 — artikel tidak di-centrifuge

**Sumber:** [GAA — Coating Thickness and Factors Influencing Thickness](https://gaa.com.au/coating-thickness-and-factors-influencing-thickness/).
Nilai average (45/55/70/85) cocok persis dengan tabel di bawah, termasuk arah
batas 1,5 mm (`≤ 1,5 → 45`). GAA juga memuat **Table 2 (centrifuged articles)**:
`< 8 mm → 35 µm`, `≥ 8 mm → 55 µm` — belum didukung di config v1 (lihat catatan
di bagian "Aturan penerimaan").

| Tebal baja | Local min (µm) | Average min (µm) |
|---|---|---|
| > 6 mm | 70 | 85 |
| > 3 mm s/d ≤ 6 mm | 55 | 70 |
| > 1,5 mm s/d ≤ 3 mm | 45 | 55 |
| ≤ 1,5 mm | 35 | 45 |

> Nilai *local* (kolom pertama) tidak muncul terpisah di halaman GAA yang
> dicek — hanya kolom "Average Coating Thickness". Nilai local di tabel ini
> mengikuti pola spread yang sama dengan ISO 1461 (≈15 µm di bawah average),
> konsisten dengan versi lama file ini, tapi **belum dikonfirmasi independen**
> ke sumber terbuka manapun. Perlu dicari halaman GAA/asosiasi lain yang
> eksplisit memisahkan local vs average untuk AS/NZS 4680.

## Perbedaan batas 1,5 mm — alasan dua file config terpisah

Angka AS/NZS 4680 selaras dengan ISO 1461, tetapi **penulisan batas kelas di
titik 1,5 mm berbeda**:

- ISO 1461: `≥ 1,5` masuk kelas **45/55**
- AS/NZS 4680: `≤ 1,5` masuk kelas **35/45**

Baja tepat 1,5 mm memberi hasil berbeda. Menggabungkan kedua tabel menghapus
perbedaan ini secara diam-diam, dan test boundary di 1,5 mm tidak akan pernah
menangkapnya. Verifikasi batas ini terhadap edisi yang dipegang.

## Aturan penerimaan (berlaku untuk keduanya)

- **Local coating thickness** = rata-rata pembacaan di dalam satu *reference
  area*. Harus ≥ nilai *local*.
- **Mean / average coating thickness** = rata-rata dari semua local thickness
  pada satu artikel besar, atau pada seluruh control sample. Harus ≥ nilai *mean*.
- Jumlah reference area dan jumlah pembacaan per area mengikuti klausul sampling
  masing-masing standar.
- Tidak ada batas maksimum ketebalan (umumnya).
- **Artikel yang di-centrifuge** memakai tabel tersendiri — belum didukung di v1.
  Tool harus menolak, bukan memakai tabel non-centrifuged sebagai pendekatan.

## Struktur data yang dipakai tool

Berbeda dari ASTM (yang mengeluarkan satu *grade*), keluarga ISO mengeluarkan
**dua angka**: `local_um` dan `mean_um`. Konsekuensinya pada evaluasi pembacaan:

- `readingsUm` diinterpretasi sebagai array **per reference area** (bukan per
  specimen seperti ASTM).
- Rata-rata tiap array = local thickness area tersebut → dibandingkan ke `local_um`.
- Rata-rata dari semua local thickness → dibandingkan ke `mean_um`.
- Gagal di salah satu → `NON_CONFORMING`.
