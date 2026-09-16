# ISO 1461 & AS/NZS 4680 — Referensi Tabel & Aturan

> **Status verifikasi:** nilai di bawah adalah referensi umum dari edisi yang
> banyak dipakai. **Wajib diverifikasi** terhadap edisi yang dimiliki secara sah,
> dan nomor edisinya dicatat di file config.

Keduanya disimpan sebagai **file config terpisah**, bukan satu tabel bersama.
Lihat catatan batas 1,5 mm di bawah.

## ISO 1461 — artikel tidak di-centrifuge

| Tebal baja | Local min (µm) | Mean min (µm) |
|---|---|---|
| > 6 mm | 70 | 85 |
| > 3 mm s/d ≤ 6 mm | 55 | 70 |
| ≥ 1,5 mm s/d ≤ 3 mm | 45 | 55 |
| < 1,5 mm | 35 | 45 |

### ISO 1461 — casting

| Tebal baja | Local min (µm) | Mean min (µm) |
|---|---|---|
| ≥ 6 mm | 70 | 80 |
| < 6 mm | 60 | 70 |

## AS/NZS 4680 — artikel tidak di-centrifuge

| Tebal baja | Local min (µm) | Average min (µm) |
|---|---|---|
| > 6 mm | 70 | 85 |
| > 3 mm s/d ≤ 6 mm | 55 | 70 |
| > 1,5 mm s/d ≤ 3 mm | 45 | 55 |
| ≤ 1,5 mm | 35 | 45 |

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
