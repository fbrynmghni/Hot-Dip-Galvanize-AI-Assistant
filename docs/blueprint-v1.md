> **ARSIP — blueprint GalvaAI versi 1 (utuh).**
> Dokumen ini disimpan sebagai jaring pengaman dan bahan bacaan naratif.
> Untuk kerja sehari-hari, gunakan `CLAUDE.md` (aturan aktif) dan skill di
> `.claude/skills/` (detail prosedural + `references/`). Bila ada perbedaan
> angka antara file ini dan `references/` di skill, **`references/` yang berlaku** —
> file ini tidak lagi di-update.

---

# GalvaAI — Web-Based AI Assistant untuk Hot Dip Galvanizing (HDG)

> **Blueprint teknis & produk**
> Disusun dari sudut pandang Metallurgical Engineer dengan 10 tahun pengalaman di plant hot dip galvanizing (batch / after-fabrication), dipadukan dengan desain sistem software modern (RAG + LLM + tool calling).
>
> **Sumber pengetahuan utama:**
> - American Galvanizers Association (AGA) — https://galvanizeit.org/
> - Galvanizers Association of Australia (GAA) — https://gaa.com.au/

---

## Daftar Isi

1. [Visi & Ruang Lingkup](#1-visi--ruang-lingkup)
2. [Target Pengguna & Use Case](#2-target-pengguna--use-case)
3. [Fondasi Domain: Technical Knowledge HDG](#3-fondasi-domain-technical-knowledge-hdg)
4. [Arsitektur Sistem](#4-arsitektur-sistem)
5. [Pipeline Ingestion Pengetahuan (RAG)](#5-pipeline-ingestion-pengetahuan-rag)
6. [Engineering Tools (Kalkulator Deterministik)](#6-engineering-tools-kalkulator-deterministik)
7. [Desain AI: System Prompt, Tool Calling, Guardrails](#7-desain-ai-system-prompt-tool-calling-guardrails)
8. [Struktur Halaman Web (Knowledge Hub)](#8-struktur-halaman-web-knowledge-hub)
9. [Data Model & API](#9-data-model--api)
10. [Evaluasi Kualitas Jawaban](#10-evaluasi-kualitas-jawaban)
11. [Legal, Hak Cipta & Etika Konten](#11-legal-hak-cipta--etika-konten)
12. [Roadmap Pengembangan](#12-roadmap-pengembangan)
13. [Lampiran: Glosarium & Konversi Satuan](#13-lampiran-glosarium--konversi-satuan)

---

## 1. Visi & Ruang Lingkup

**GalvaAI** adalah knowledge hub + AI assistant yang menjawab pertanyaan seputar hot dip galvanizing secara akurat, bersumber jelas, dan praktis — dari "berapa ketebalan coating minimum untuk plat 10 mm?" sampai "kenapa hasil galvanis saya kusam abu-abu dan tebal?".

### Prinsip utama

| Prinsip | Implementasi |
|---|---|
| **Grounded** | Setiap jawaban teknis wajib berbasis dokumen hasil retrieval + dicantumkan sitasi (link ke AGA/GAA). |
| **Deterministik untuk angka** | Perhitungan (ketebalan, umur layanan, konversi, reaktivitas baja) dikerjakan oleh *tool* kode, bukan oleh LLM "menebak". |
| **Multi-standar** | Membedakan konteks ASTM (Amerika), ISO (internasional), dan AS/NZS (Australia/NZ). Tidak mencampur angka antar standar. |
| **Engineer-in-the-loop** | Assistant bersifat edukatif & pendukung keputusan; keputusan desain kritis tetap dikonfirmasi ke engineer/galvanizer. |
| **Bilingual** | Antarmuka & jawaban Bahasa Indonesia, istilah teknis tetap Inggris (industry standard terms). |

### Di luar scope (v1)
- Continuous galvanizing (sheet/coil, ASTM A653) — hanya disebut sebagai pembanding.
- Electrogalvanizing, sherardizing, mechanical plating — hanya pembanding.
- Konsultasi legal/kontrak & sertifikasi resmi.

---

## 2. Target Pengguna & Use Case

| Persona | Kebutuhan tipikal | Contoh pertanyaan |
|---|---|---|
| **Structural / civil engineer** | Spesifikasi & durability | "Untuk lingkungan pesisir C4, HDG 85 µm bertahan berapa lama?" |
| **Fabricator** | Desain venting, distorsi, pengelasan | "Lubang vent untuk hollow section 100×100 perlu berapa?" |
| **QC inspector** | Kriteria terima/tolak | "Wet storage stain itu reject atau tidak?" |
| **Galvanizer / plant operator** | Troubleshooting proses | "Kenapa coating over-thick di baja Si 0,08%?" |
| **Procurement / owner** | Biaya & life-cycle cost | "HDG vs cat epoxy, mana lebih murah dalam 50 tahun?" |
| **Mahasiswa / pengajar** | Konsep dasar metalurgi | "Jelaskan lapisan Gamma, Delta, Zeta, Eta." |

---

## 3. Fondasi Domain: Technical Knowledge HDG

Bagian ini adalah "otak domain" yang dipakai untuk: (a) menyusun taksonomi konten, (b) menulis system prompt, (c) membuat test set evaluasi, dan (d) mendesain kalkulator.

> ⚠️ **Catatan engineer:** Angka-angka di bawah adalah nilai referensi umum industri. Sebelum di-hardcode ke dalam tool produksi, **setiap tabel wajib diverifikasi ulang terhadap edisi standar terbaru** (ASTM, ISO, AS/NZS) yang dimiliki secara legal, dan dicatat nomor edisinya di file konfigurasi.

### 3.1 Tahapan Proses Batch HDG

```
Fabricated steel
   │
   ▼
[1] Degreasing (caustic/acid degreaser, hangat)  → hilangkan minyak, oli, cat marker
   ▼
[2] Rinsing
   ▼
[3] Pickling (HCl encer suhu ruang / H2SO4 dipanaskan) → hilangkan mill scale & karat
   ▼
[4] Rinsing
   ▼
[5] Fluxing (zinc ammonium chloride, ±60–80 °C) → cegah re-oksidasi, bantu wetting
   ▼
[6] Drying / preheat
   ▼
[7] Galvanizing kettle (molten zinc ±445–455 °C) → reaksi metalurgi Fe–Zn
   ▼
[8] Cooling / quenching (air, atau larutan passivasi)
   ▼
[9] Inspection (ketebalan, visual, adhesi) → dressing/repair bila perlu
```

**Poin kritis dari pengalaman lapangan:**
- **Surface preparation adalah penyebab #1 cacat.** Zinc tidak bereaksi dengan permukaan yang tidak bersih; hasilnya *bare spot*. Cat, weld slag, dan anti-spatter berbasis silikon **tidak hilang** di degreasing/pickling — harus dihilangkan mekanis (blasting/grinding) di fabricator.
- **Over-pickling** → permukaan kasar & risiko hidrogen pada baja berkekuatan tinggi.
- **Flux yang terkontaminasi besi** → dross meningkat, konsumsi zinc naik, ash tinggi.
- **Immersion time** umumnya beberapa menit; lebih lama tidak selalu lebih baik — pada baja reaktif, ketebalan tumbuh hampir linear (tidak parabolik).

### 3.2 Metalurgi Coating: Lapisan Intermetalik Zn–Fe

| Lapisan | Fase | Kandungan Fe (±) | Kekerasan (DPN, ±) | Karakter |
|---|---|---|---|---|
| **Eta (η)** | Zn murni | ~0% | ~70 | Paling luar, ulet, memberi kilap |
| **Zeta (ζ)** | FeZn13 | ~6% | ~179 | Kristal kolumnar |
| **Delta (δ)** | FeZn7 / FeZn10 | ~7–12% | ~244 | Kompak |
| **Gamma (Γ)** | Fe3Zn10 | ~21–28% | ~250 | Sangat tipis, menempel ke baja |
| Base steel | — | — | ~159 | — |

Implikasi praktis:
- Lapisan intermetalik **lebih keras dari baja dasar** → ketahanan abrasi & impact tinggi.
- Coating terikat secara **metalurgi** (bukan mekanis seperti cat), sehingga adhesi sangat tinggi.
- **Cathodic protection**: zinc bersifat anodik terhadap baja → goresan kecil tetap terlindungi (sacrificial).
- **Barrier protection**: patina zinc (zinc oxide → zinc hydroxide → zinc carbonate) terbentuk seiring waktu dan memperlambat laju korosi.

### 3.3 Kimia Baja & Reaktivitas (Sandelin Effect)

Kandungan **Silikon (Si)** dan **Fosfor (P)** sangat memengaruhi tampilan & ketebalan coating.

| Rentang Si (± umum) | Perilaku | Tampilan tipikal |
|---|---|---|
| < 0,04% | Low reactivity | Mengkilap, coating relatif tipis |
| 0,04–0,15% | **Sandelin range** — sangat reaktif | Tebal, kusam abu-abu, rawan getas/flaking |
| 0,15–0,22% | Reaktivitas moderat/terkendali | Relatif baik |
| > 0,22% | Reaktivitas naik lagi | Tebal, abu-abu matte |

- Indikator praktis yang sering dipakai: **Si + 2,5 × P** (fosfor memperkuat efek silikon).
- Coating abu-abu kusam **bukan cacat** secara spesifikasi selama ketebalan & adhesi memenuhi — ketahanan korosinya sebanding atau lebih baik karena lebih tebal.
- Pencampuran baja berbeda kimia dalam satu assembly → **tampilan tidak seragam**. Ini perlu dikomunikasikan ke owner sejak awal (terutama untuk AESS).

### 3.4 Standar yang Wajib Dipahami Assistant

| Area | ASTM (AGA) | ISO / AS/NZS (GAA) |
|---|---|---|
| Coating produk fabrikasi | **ASTM A123/A123M** | **ISO 1461**, **AS/NZS 4680** |
| Hardware / fastener | **ASTM A153/A153M** | ISO 10684 (fastener) |
| Rebar | **ASTM A767/A767M** | AS/NZS 4680 (umum) |
| Praktik desain | **ASTM A385** | **AS/NZS 2312.2** (durability HDG) |
| Perbaikan coating | **ASTM A780** | ISO 1461 (klausul repair), AS/NZS 4680 |
| Pencegahan embrittlement | **ASTM A143** | — |
| Pencegahan distorsi | **ASTM A384** | — |
| Pengukuran ketebalan | **ASTM E376**, ASTM A90 (massa) | ISO 2178, ISO 1460 |
| Persiapan untuk cat / powder | **ASTM D6386**, **ASTM D7803** | AS/NZS 2312.2 |
| Hollow section | — | **AS/NZS 4792** |
| Klasifikasi korosivitas | — | **ISO 9223** (C1–CX) |

**Aturan untuk AI:** jika user tidak menyebut standar, **tanyakan atau sajikan keduanya secara terpisah**. Jangan pernah mencampur angka ASTM dengan ISO dalam satu tabel tanpa label.

### 3.5 Ketebalan Coating Minimum — Dua Standar yang Bisa Dipilih User

GalvaAI mendukung **dua keluarga standar**. User memilih salah satu di UI (atau menyebutnya di chat), lalu kalkulator & AI hanya memakai tabel dari standar tersebut.

| Opsi di UI | Standar | Konteks | Sumber rujukan |
|---|---|---|---|
| `ASTM_A123` | **ASTM A123/A123M** | Amerika Utara, banyak proyek EPC/oil & gas | AGA (galvanizeit.org) |
| `ISO1461` | **ISO 1461** | Internasional, Eropa, Asia | GAA / umum |
| `ASNZS4680` | **AS/NZS 4680** | Australia & Selandia Baru | GAA (gaa.com.au) |

> ⚠️ Semua nilai di bawah adalah referensi umum dari edisi yang banyak dipakai. **Wajib diverifikasi** terhadap edisi terbaru yang dimiliki secara legal sebelum dipakai di produksi. Catat edisinya di file config.

#### 3.5.1 ASTM A123/A123M (Revisi 2024) — Table 1: Minimum Average Coating Thickness Grade by Material Category

> **Sumber:** AGA, *2024 Revision of ASTM A123* — https://galvanizeit.org/knowledgebase/article/2024-revision-of-astm-a123
> Berlaku untuk **semua specimen yang diuji**, berdasarkan **tebal baja terukur (measured)**, bukan nominal.

| Kategori material | < 1/16 in [< 1,6 mm] | 1/16 – < 1/8 in [1,6 – < 3,2 mm] | 1/8 – 3/16 in [3,2 – 4,8 mm] | > 3/16 – < 1/4 in [> 4,8 – < 6,4 mm] | 1/4 – < 5/8 in [6,4 – < 16,0 mm] | ≥ 5/8 in [≥ 16,0 mm] |
|---|---|---|---|---|---|---|
| **Structural Shapes** | 45 | 65 | 75 | 75 | 100 | 100 |
| **Strip and Bar** | 45 | 65 | 75 | 75 | 75 | 100 |
| **Plate** | 45 | 65 | 75 | 75 | 75 | 100 |
| **Pipe & Tubing** | 45 | 45 | 75 | 75 | 75 | 75 |
| **Wire** | 35 | 50 | 60 | 65 | 80 | 80 |
| **Reinforcing Bar** | — | — | — | — | 100 | 100 |
| **Forgings and Castings** | — | — | — | 100 | 100 | 100 |

"—" = tidak ada persyaratan untuk rentang tersebut di Table 1 (tool harus menolak/menandai, bukan menebak).

> ⚠️ **Catatan inklusivitas batas:** tampilan tabel di halaman web AGA tidak menampilkan simbol ≥/≤ secara konsisten. Batas yang dipakai di blueprint ini (≥ 1,6 · ≥ 3,2 · ≤ 4,8 · > 4,8 · ≥ 6,4 · ≥ 16,0 mm) adalah interpretasi konvensional dan **wajib dicek terhadap dokumen ASTM A123/A123M-24 asli** sebelum produksi.

**Perubahan penting dibanding edisi sebelumnya:**
- **Plate dipisah dari Structural Shapes.** Plate 6,4 – < 16 mm kini **Grade 75** (bukan 100); baru Grade 100 pada ≥ 16 mm.
- **Structural Shapes & Plate > 4,8 – < 6,4 mm** kini **Grade 75** (sebelumnya 85).
- **Rentang baru ≥ 5/8 in (16 mm)**.
- **Kategori baru:** Reinforcing Bar dan Forgings & Castings (untuk forging/casting yang tidak bisa diproses sesuai A153).

**Appendix X1.1 — penentuan kategori material (dirangkum):**

| Produk | Kategori yang benar |
|---|---|
| Bar grating | Strip and Bar |
| Handrail | Pipe & Tubing |
| Rolled beam, rolled angle | Structural Shapes |
| Plate girder / beam dari plat | Plate |
| Angle dari plat yang dilas | Plate |
| Pole dari plat bending (bulat/poligonal) | Plate (bukan Pipe & Tubing) |

Contoh dampaknya: beam tebal terukur ½ in → rolled beam = **Grade 100**, tetapi plate girder = **Grade 75**. Sebaliknya, pole dari plat 5/8 in = **Grade 100**, bukan 75.

**Appendix X1.2 — tebal baja (dirangkum):**
- Gunakan **tebal terukur**; tebal nominal pipa/tube/plat bisa menghasilkan grade yang salah.
- Jika tebal sebelum galvanis tidak tersedia, boleh diukur setelah galvanis sebagai pendekatan; bila tidak dapat diakses, rujuk tebal nominal/gambar proyek.
- **Desain tapered** dan **structural shapes dengan flange/web/leg berbeda tebal** → pakai **bagian paling tipis**.
- **Expanded metal** → pakai tebal sheet terukur.

#### 3.5.2 ASTM A123 — Table 2: Konversi Coating Grade

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

**Aturan penerimaan ASTM A123-24 (ringkas):**
- **Rata-rata semua specimen** harus ≥ grade dari Table 1.
- **Setiap specimen individual** minimal **satu grade di bawah** syarat Table 1, dan urutan "satu grade di bawah" **diambil dari Table 2**, bukan Table 1 (revisi 2024 menegaskan ini). Contoh: syarat Grade 100 → individu minimal **Grade 85**, walaupun angka 85 tidak muncul di Table 1.
- **Tidak ada batas maksimum** ketebalan (coating tebal tidak otomatis reject, kecuali mengganggu *intended use*, membuat permukaan tidak bisa mating, atau berbahaya saat handling).
- **Intended use** (def. 3.2.5) = fungsi produk, fit-up, dan kemampuan untuk dicat/powder coat — **bukan tampilan**. Kekasaran ringan akibat dross, kondisi permukaan awal, atau reaktivitas baja bukan alasan reject.
- **AESS / duplex / estetika khusus** → kriteria tampilan harus disepakati galvanizer–pembeli dan ditulis di PO (6.4.1).
- **Masking** (def. 3.2.6): area yang di-masking tidak dihitung sebagai *accessible surface area*, sehingga batas luas repair (0,5% area atau 36 in² per short ton) dihitung tanpa area masking.
- **Re-galvanizing** tidak menjamin memperbaiki bare area akibat kesalahan desain/fabrikasi (Note 9) → patuhi A143, A384, A385.
- **Variasi kondisi permukaan awal** (pitting, cast surface, area machining) wajar menghasilkan ketebalan berbeda (Note 13).
- **Campuran baja reaktif & non-reaktif** dalam kategori dan rentang tebal yang sama → rencana aksi disepakati bersama; mengurangi waktu celup tidak menjamin hasil (Note 14, rujuk A385).
- Jumlah & distribusi titik ukur mengikuti klausul sampling A123 dan **ASTM E376**.
- Baut, mur, hardware kecil yang di-centrifuge → **ASTM A153**.

#### 3.5.3 ISO 1461 — Artikel tidak di-centrifuge

| Tebal baja | Local min (µm) | Mean min (µm) |
|---|---|---|
| > 6 mm | 70 | 85 |
| > 3 mm s/d ≤ 6 mm | 55 | 70 |
| ≥ 1,5 mm s/d ≤ 3 mm | 45 | 55 |
| < 1,5 mm | 35 | 45 |
| Casting ≥ 6 mm | 70 | 80 |
| Casting < 6 mm | 60 | 70 |

#### 3.5.4 AS/NZS 4680 — Artikel tidak di-centrifuge

| Tebal baja | Local min (µm) | Average min (µm) |
|---|---|---|
| > 6 mm | 70 | 85 |
| > 3 mm s/d ≤ 6 mm | 55 | 70 |
| > 1,5 mm s/d ≤ 3 mm | 45 | 55 |
| ≤ 1,5 mm | 35 | 45 |

> Angka AS/NZS 4680 selaras dengan ISO 1461, tetapi **penulisan batas kelas di titik 1,5 mm berbeda** (ISO: "≥ 1,5" masuk kelas 45/55; AS/NZS: "≤ 1,5" masuk kelas 35/45). Karena itu keduanya disimpan sebagai **config terpisah**, bukan satu tabel yang dipakai bersama. Verifikasi batas ini pada edisi yang lu pegang.

**Aturan penerimaan ISO 1461 / AS/NZS 4680 (ringkas):**
- **Local coating thickness** = rata-rata pembacaan di dalam satu *reference area* → harus ≥ nilai *local*.
- **Mean / average coating thickness** = rata-rata dari semua local thickness pada satu artikel besar atau seluruh control sample → harus ≥ nilai *mean*.
- Jumlah reference area & pembacaan per area mengikuti klausul sampling standar.
- Artikel yang **di-centrifuge** memakai tabel tersendiri (belum dimasukkan di v1).

#### 3.5.5 Perbedaan Kunci ASTM A123 vs ISO 1461 / AS/NZS 4680

| Aspek | ASTM A123-24 | ISO 1461 / AS/NZS 4680 |
|---|---|---|
| Input penentu | **Kategori material (7 kategori) + tebal baja terukur** | **Tebal baja** (+ casting / centrifuged) |
| Output | Coating Grade (µm) | Local min & mean min (µm) |
| Batas ketebalan | Dalam inci (A123) / mm (A123M), 6 rentang | mm, 4 rentang |
| Baja 10 mm | Structural shapes **100 µm** · Plate **75 µm** | **85 µm** (mean) |
| Kriteria individu | 1 grade di bawah (urutan Table 2) | Nilai *local* per reference area |
| Batas maksimum | Tidak ada | Tidak ada (umumnya) |

**Contoh nyata:** baja 10 mm, rata-rata terukur 90 µm.
- ISO 1461 → **lolos** (≥ 85 µm).
- ASTM A123-24 **plate** → **lolos** (≥ 75 µm).
- ASTM A123-24 **rolled beam (structural shapes)** → **tidak lolos** (< 100 µm).

Satu produk bisa lolos atau gagal hanya karena standar dan kategori materialnya berbeda — makanya GalvaAI **wajib** tahu standar dan kategori yang dipakai.

### 3.6 Durability & Time to First Maintenance

Laju korosi zinc berdasarkan kategori ISO 9223 (referensi umum):

| Kategori | Lingkungan tipikal | Laju korosi zinc (µm/tahun) |
|---|---|---|
| C1 | Indoor kering | ≤ 0,1 |
| C2 | Rural, polusi rendah | 0,1 – 0,7 |
| C3 | Urban / pesisir ringan | 0,7 – 2,1 |
| C4 | Industri / pesisir | 2,1 – 4,2 |
| C5 | Industri berat / pesisir agresif | 4,2 – 8,4 |
| CX | Offshore / ekstrem | 8,4 – 25 |

**Estimasi kasar:** `Umur (tahun) ≈ Ketebalan coating (µm) ÷ Laju korosi (µm/tahun)`

Definisi AGA untuk *time to first maintenance* adalah saat ~5% permukaan menunjukkan karat baja dasar, sehingga estimasi AGA/GAA sedikit berbeda dari rumus linear. Assistant harus:
- Memberi **rentang** (pakai laju min & max), bukan satu angka.
- Mengarahkan ke tool resmi: *Durability of Galvanizing Estimator* (GAA) dan *Life-Cycle Cost Calculator* (AGA/GAA) untuk kasus nyata.
- Konteks Indonesia: iklim tropis lembap + banyak lokasi pesisir → default asumsi minimal **C3–C4** jika user tidak tahu, dan **C5** untuk splash zone/area dekat pantai.

### 3.7 Design & Fabrication for HDG

1. **Venting & drainage** — wajib untuk hollow section, tangki, pipa, rangka tertutup.
   - Fungsi: udara/uap keluar, zinc masuk & mengalir keluar, cegah flux/acid terjebak.
   - **Keselamatan:** rongga tertutup tanpa vent dapat **meledak** di kettle (uap air/udara mengembang pada ±450 °C). Ini isu safety, bukan sekadar kualitas.
   - Posisi vent di sudut diagonal (paling atas & paling bawah saat dicelup).
2. **Distorsi & warpage** (ASTM A384)
   - Hindari kombinasi tebal-tipis ekstrem dalam satu assembly.
   - Desain simetris; hindari residual stress tinggi dari pengelasan.
3. **Pengelasan**
   - Bersihkan slag total; hindari anti-spatter berbasis silikon.
   - Komposisi weld metal (Si tinggi) dapat menyebabkan tampilan/ketebalan berbeda di area las.
4. **Ukuran kettle** — cek dimensi kettle galvanizer; item terlalu panjang bisa *progressive/double dipping* (ada konsekuensi tampilan & distorsi).
5. **Embrittlement** (ASTM A143)
   - **Hydrogen embrittlement:** risiko pada baja kekuatan sangat tinggi (umumnya kelas tensile sangat tinggi); diwaspadai dari proses pickling.
   - **Strain-age embrittlement:** pada baja yang di-cold work berat.
   - **LMAC (Liquid Metal Assisted Cracking):** jarang, terkait tegangan tinggi + kondisi tertentu.
6. **Dissimilar metals** — kontak dengan tembaga/kuningan/stainless di lingkungan basah → galvanic corrosion pada zinc; gunakan isolasi.
7. **Masking** — area yang tidak boleh terlapis (faying surface slip-critical tertentu, ulir) dirancang sejak awal.
8. **Fastener** — baut HDG butuh *overtapping* mur; ulir di-centrifuge.

### 3.8 Inspeksi & Kriteria Penerimaan

| Kondisi | Status umum | Catatan |
|---|---|---|
| Bare spot kecil | Boleh direpair (dalam batas) | ASTM A123 membatasi luas & ukuran area repair |
| Bare spot besar / banyak | Reject → regalvanize | — |
| Dross protrusion | Tergantung fungsi | Reject bila mengganggu fungsi/keamanan |
| Flux inclusion | Reject bila menutupi bare area | Harus dibersihkan & dicek ketebalan |
| Ash inclusion | Umumnya dibersihkan, cek ketebalan di bawahnya | — |
| Kusam abu-abu (Si tinggi) | **Accept** | Bukan cacat bila ketebalan & adhesi OK |
| Wet storage stain ringan | **Accept** | Umumnya hilang dengan pelapukan alami |
| Wet storage stain berat | Perlu evaluasi | Cek ketebalan tersisa; bersihkan |
| Rust stain | Evaluasi sumber | Sering transfer dari benda lain, bukan kegagalan coating |
| Flaking / peeling | Reject | Indikasi coating terlalu tebal/getas atau masalah adhesi |

**Metode pengukuran:** magnetic thickness gauge (paling umum), stripping/weigh (massa per luas), mikroskopi (cross-section, destruktif). Penting: jumlah & distribusi titik ukur mengikuti standar yang dipakai.

**Repair (ASTM A780):** zinc-rich paint, zinc-based solder, atau zinc metallizing (thermal spray). Ketebalan repair umumnya disyaratkan lebih tebal dari coating sekitarnya.

### 3.9 Post-Galvanizing

- **Duplex system** (HDG + cat/powder): efek sinergi → umur gabungan lebih panjang dari penjumlahan masing-masing. Persiapan permukaan wajib mengikuti ASTM D6386 (cat) / D7803 (powder) — mis. sweep blasting ringan; hindari cat alkyd langsung di atas zinc (saponifikasi).
- **Temperatur servis:** HDG umumnya aman untuk paparan kontinu hingga sekitar 200 °C; di atas itu risiko pemisahan lapisan meningkat.
- **Penyimpanan:** hindari menumpuk rapat di kondisi lembap tanpa sirkulasi udara (penyebab wet storage stain).
- **Beton:** HDG rebar kompatibel; reaksi awal zinc–semen basah menghasilkan hidrogen singkat, umumnya dikelola dengan passivasi (chromate atau alternatif).

### 3.10 Troubleshooting Matrix (untuk AI & halaman FAQ)

| Gejala | Kemungkinan penyebab | Tindakan |
|---|---|---|
| Bare spot | Kontaminasi (cat, slag, silikon), flux rusak | Blast area, regalvanize / repair |
| Coating terlalu tebal, kusam | Si/P di Sandelin range, immersion lama, suhu tinggi | Pilih baja Si rendah / kontrol waktu celup |
| Flaking | Coating sangat tebal & getas | Evaluasi kimia baja, kontrol proses |
| Blister / pinholes | Gas dari baja (hidrogen), porositas casting | Kontrol pickling, blast casting |
| Lumps / runs | Drainase buruk, withdrawal cepat | Perbaiki desain drainase, kecepatan angkat |
| Distorsi | Residual stress, beda tebal, dipping tidak simetris | ASTM A384, desain simetris |
| Retak | Embrittlement, LMAC | ASTM A143, evaluasi baja & detail desain |
| White rust | Kelembapan + ventilasi buruk saat simpan | Stack dengan spacer, passivasi |

---

## 4. Arsitektur Sistem

```
┌──────────────────────────────────────────────────────────────┐
│                         FRONTEND                             │
│  Next.js (App Router) + TypeScript + Tailwind                │
│  • Knowledge Hub (artikel, glosarium, standar)               │
│  • Chat UI (streaming, sitasi, feedback 👍/👎)               │
│  • Calculator pages (thickness, durability, reactivity)      │
└───────────────┬──────────────────────────────────────────────┘
                │ HTTPS (Route Handlers / Server Actions)
┌───────────────▼──────────────────────────────────────────────┐
│                      BACKEND / API                           │
│  /api/chat      → orchestrator (RAG + tool calling)          │
│  /api/tools/*   → kalkulator deterministik                   │
│  /api/feedback  → logging kualitas                           │
│  Rate limit (Upstash) · Auth opsional (Supabase Auth)        │
└──────┬──────────────────┬───────────────────┬────────────────┘
       │                  │                   │
┌──────▼──────┐   ┌───────▼────────┐   ┌──────▼───────────────┐
│  LLM API    │   │ Vector Store   │   │  Engineering Config  │
│  Claude     │   │ Postgres +     │   │  (tabel standar,     │
│  (Anthropic)│   │ pgvector       │   │   versi terverifikasi)│
└─────────────┘   └───────▲────────┘   └──────────────────────┘
                          │
                ┌─────────┴──────────┐
                │ Ingestion Worker   │
                │ (Python/TS, cron)  │
                │ crawl → clean →    │
                │ chunk → embed      │
                └────────────────────┘
```

### Tech stack yang direkomendasikan

| Layer | Pilihan | Alasan |
|---|---|---|
| Framework | **Next.js 15 + TypeScript** | SSR untuk SEO konten, API di satu repo |
| UI | Tailwind CSS + shadcn/ui | Cepat, konsisten |
| LLM | **Claude API** (mis. `claude-sonnet-5`) | Kuat di reasoning teknis & tool use |
| Embedding | Voyage AI / model embedding multilingual | Query Indonesia ↔ dokumen Inggris |
| Vector DB | **Supabase Postgres + pgvector** | Satu DB untuk data relasional & vektor |
| Re-ranking | Cohere Rerank / Voyage rerank | Presisi retrieval untuk istilah teknis |
| Ingestion | Python (httpx, trafilatura, pdfplumber) | Ekosistem parsing matang |
| Validasi | **Zod** (TS) / Pydantic (Py) | Input tool harus tervalidasi ketat |
| Observability | Langfuse / Helicone | Trace prompt, biaya, latensi |
| Deploy | Vercel (web) + Supabase + cron worker | Low-ops |

### Struktur repo

```
galva-ai/
├── apps/web/                      # Next.js
│   ├── app/
│   │   ├── (hub)/learn/[slug]/    # halaman artikel
│   │   ├── chat/                  # UI chat
│   │   ├── tools/                 # kalkulator
│   │   └── api/
│   │       ├── chat/route.ts
│   │       └── tools/[name]/route.ts
│   ├── lib/
│   │   ├── rag/retrieve.ts
│   │   ├── llm/system-prompt.ts
│   │   └── tools/                 # logika engineering (pure functions)
│   │       ├── coating-thickness.ts
│   │       ├── durability.ts
│   │       ├── steel-reactivity.ts
│   │       └── units.ts
│   └── tests/
├── packages/engineering-config/   # tabel standar (JSON, versioned)
│   ├── astm-a123.v1.json          # Table 1 + Table 2 (grade)
│   ├── iso1461.v1.json
│   ├── asnzs4680.v1.json
│   └── iso9223-zinc.v1.json
├── workers/ingest/                # Python crawler & embedder
└── eval/                          # golden Q&A + scripts
```

---

## 5. Pipeline Ingestion Pengetahuan (RAG)

### 5.1 Peta sumber (berdasarkan struktur situs)

**AGA — galvanizeit.org**
- Corrosion: science, process, protection, effects
- Hot-Dip Galvanizing: what is galvanizing, HDG process, how long does HDG last, cost, zinc
- Design & Fabrication: design considerations, fabrication considerations
- Specification & Inspection: coating specs, duplex, AESS, inspection, repair, post-HDG
- **Dr. Galv KnowledgeBase** (kategori: appearance, coating thickness, embrittlement, fasteners, HDG process, specifications, inspection, performance, reinforcing steel, steel selection, touch-up & repair, zinc coatings) — **sumber Q&A paling bernilai**
  - Prioritas: artikel revisi standar, mis. *2024 Revision of ASTM A123* (https://galvanizeit.org/knowledgebase/article/2024-revision-of-astm-a123). Artikel revisi diberi metadata `supersedes` agar retrieval tidak mengambil angka edisi lama.
- Publications, News

**GAA — gaa.com.au**
- Process, Design, Durability, Specification & Inspection, Sustainability, Painting
- FAQ, Glossary of Galvanizing Terms
- Technical Publications, Case Studies
- Durability of Galvanizing Estimator, Life Cycle Costing Calculator (→ **dirujuk via link**, tidak di-scrape)

### 5.2 Alur ingestion

```python
# workers/ingest/pipeline.py (ringkas)
from dataclasses import dataclass
import hashlib, httpx, trafilatura
from urllib.robotparser import RobotFileParser

@dataclass
class Chunk:
    source: str            # "AGA" | "GAA"
    url: str
    title: str
    section: str           # mis. "Design & Fabrication"
    standard_family: str   # "ASTM" | "ISO/ASNZS" | "general"
    topics: list[str]      # taksonomi domain (lihat 5.3)
    text: str
    content_hash: str

ALLOWED = {"galvanizeit.org", "gaa.com.au"}

def can_fetch(url: str) -> bool:
    rp = RobotFileParser()
    host = url.split("/")[2]
    rp.set_url(f"https://{host}/robots.txt")
    rp.read()
    return rp.can_fetch("GalvaAI-Bot", url)

def fetch_clean(url: str) -> str | None:
    if not can_fetch(url):
        return None
    r = httpx.get(url, timeout=30, headers={"User-Agent": "GalvaAI-Bot (contact: you@domain)"})
    r.raise_for_status()
    # buang navbar, footer, cookie banner, logo sponsor
    return trafilatura.extract(r.text, include_tables=True, favor_precision=True)

def chunk_by_heading(text: str, max_tokens=500, overlap=60) -> list[str]:
    """Split per heading dulu (menjaga konteks teknis), baru per token."""
    ...

def infer_standard_family(source: str, text: str) -> str:
    t = text.upper()
    if "ASTM" in t: return "ASTM"
    if "AS/NZS" in t or "ISO 1461" in t: return "ISO/ASNZS"
    return "ASTM" if source == "AGA" else "ISO/ASNZS"
```

**Aturan penting:**
- Crawl **sopan**: patuhi `robots.txt`, rate limit (≥ 2–3 detik per request), user-agent jelas.
- Simpan `content_hash` → re-ingest hanya halaman yang berubah (cron mingguan).
- **Chunk per heading**: tabel ketebalan jangan dipotong di tengah baris.
- Tabel disimpan juga dalam bentuk terstruktur (JSON) agar tidak "rusak" saat embedding.
- Halaman member-only / login **tidak** diambil.

### 5.3 Taksonomi topik (metadata filter)

```ts
export const HDG_TOPICS = [
  "corrosion-basics", "process", "metallurgy", "steel-chemistry",
  "coating-thickness", "durability", "design-venting", "distortion",
  "welding", "embrittlement", "fasteners", "rebar", "inspection",
  "defects", "repair", "duplex-painting", "powder-coating",
  "storage-wet-storage-stain", "sustainability", "cost-lcc", "safety",
] as const;
```

Klasifikasi topik saat ingestion dilakukan dengan LLM kecil (output JSON) + validasi Zod, lalu di-spot-check manual oleh engineer.

### 5.4 Retrieval strategy

1. **Query rewriting**: pertanyaan Indonesia → diperluas ke istilah Inggris teknis.
   - "karat putih" → `wet storage stain, white rust`
   - "lubang udara" → `vent hole, venting, drainage`
   - "lapisan kusam" → `dull gray coating, reactive steel, silicon`
2. **Hybrid search**: BM25 (istilah persis seperti "A123", "Sandelin") + vektor semantik.
3. **Metadata filter** berdasarkan `standard_family` bila user menyebut standar/negara.
4. **Re-rank** top-20 → ambil top-5/6.
5. Kirim ke LLM beserta URL untuk sitasi.

```ts
// lib/rag/retrieve.ts (ringkas)
export async function retrieve(query: string, opts: { standard?: "ASTM" | "ISO/ASNZS" }) {
  const expanded = await expandQuery(query);          // ID → EN technical terms
  const [kw, vec] = await Promise.all([
    keywordSearch(expanded, opts),                    // pg full-text
    vectorSearch(await embed(expanded), opts),        // pgvector
  ]);
  const merged = reciprocalRankFusion(kw, vec);
  return rerank(expanded, merged).slice(0, 6);
}
```

---

## 6. Engineering Tools (Kalkulator Deterministik)

LLM **tidak boleh** menghitung sendiri angka engineering. Semua angka lewat fungsi murni yang teruji unit test dan membaca tabel dari config yang versinya tercatat.

### 6.1 Konfigurasi standar (versioned)

Setiap standar punya file config sendiri. Batas kelas ditulis eksplisit (`inclusive`/`exclusive`) supaya perilaku di titik batas tidak ambigu.

```json
// packages/engineering-config/astm-a123.v1.json
{
  "standard": "ASTM A123/A123M",
  "edition": "A123/A123M-24 (verifikasi ke dokumen resmi)",
  "verified_by": "NAMA_ENGINEER",
  "verified_at": "YYYY-MM-DD",
  "grades": [35, 45, 50, 55, 60, 65, 75, 80, 85, 100],
  "grade_table": {
    "35":  { "mils": 1.4, "um": 35,  "oz_ft2": 0.8, "g_m2": 245 },
    "45":  { "mils": 1.8, "um": 45,  "oz_ft2": 1.0, "g_m2": 320 },
    "50":  { "mils": 2.0, "um": 50,  "oz_ft2": 1.2, "g_m2": 355 },
    "55":  { "mils": 2.2, "um": 55,  "oz_ft2": 1.3, "g_m2": 390 },
    "60":  { "mils": 2.4, "um": 60,  "oz_ft2": 1.4, "g_m2": 425 },
    "65":  { "mils": 2.6, "um": 65,  "oz_ft2": 1.5, "g_m2": 460 },
    "75":  { "mils": 3.0, "um": 75,  "oz_ft2": 1.7, "g_m2": 530 },
    "80":  { "mils": 3.1, "um": 80,  "oz_ft2": 1.9, "g_m2": 565 },
    "85":  { "mils": 3.3, "um": 85,  "oz_ft2": 2.0, "g_m2": 600 },
    "100": { "mils": 3.9, "um": 100, "oz_ft2": 2.3, "g_m2": 705 }
  },
  "thickness_ranges": {
    "metric_mm": [
      { "id": "R1", "min": 0,    "min_incl": true,  "max": 1.6,  "max_incl": false },
      { "id": "R2", "min": 1.6,  "min_incl": true,  "max": 3.2,  "max_incl": false },
      { "id": "R3", "min": 3.2,  "min_incl": true,  "max": 4.8,  "max_incl": true  },
      { "id": "R4", "min": 4.8,  "min_incl": false, "max": 6.4,  "max_incl": false },
      { "id": "R5", "min": 6.4,  "min_incl": true,  "max": 16.0, "max_incl": false },
      { "id": "R6", "min": 16.0, "min_incl": true,  "max": null }
    ],
    "imperial_in": [
      { "id": "R1", "min": 0,      "min_incl": true,  "max": 0.0625, "max_incl": false },
      { "id": "R2", "min": 0.0625, "min_incl": true,  "max": 0.125,  "max_incl": false },
      { "id": "R3", "min": 0.125,  "min_incl": true,  "max": 0.1875, "max_incl": true  },
      { "id": "R4", "min": 0.1875, "min_incl": false, "max": 0.25,   "max_incl": false },
      { "id": "R5", "min": 0.25,   "min_incl": true,  "max": 0.625,  "max_incl": false },
      { "id": "R6", "min": 0.625,  "min_incl": true,  "max": null }
    ],
    "_boundary_note": "Inklusivitas batas WAJIB diverifikasi terhadap teks A123/A123M-24"
  },
  "table1": {
    "STRUCTURAL_SHAPES":     { "R1": 45,   "R2": 65,   "R3": 75,   "R4": 75,  "R5": 100, "R6": 100 },
    "STRIP_BAR":             { "R1": 45,   "R2": 65,   "R3": 75,   "R4": 75,  "R5": 75,  "R6": 100 },
    "PLATE":                 { "R1": 45,   "R2": 65,   "R3": 75,   "R4": 75,  "R5": 75,  "R6": 100 },
    "PIPE_TUBING":           { "R1": 45,   "R2": 45,   "R3": 75,   "R4": 75,  "R5": 75,  "R6": 75  },
    "WIRE":                  { "R1": 35,   "R2": 50,   "R3": 60,   "R4": 65,  "R5": 80,  "R6": 80  },
    "REINFORCING_BAR":       { "R1": null, "R2": null, "R3": null, "R4": null,"R5": 100, "R6": 100 },
    "FORGINGS_CASTINGS":     { "R1": null, "R2": null, "R3": null, "R4": 100, "R5": 100, "R6": 100 }
  },
  "source_url": "https://galvanizeit.org/knowledgebase/article/2024-revision-of-astm-a123"
}
```

```json
// packages/engineering-config/iso1461.v1.json
{
  "standard": "ISO 1461",
  "edition": "ISI_EDISI_YANG_DIVERIFIKASI",
  "verified_by": "NAMA_ENGINEER",
  "verified_at": "YYYY-MM-DD",
  "scope": "non-centrifuged articles",
  "rows": [
    { "min": 6.0, "min_incl": false, "max": null, "max_incl": false, "local_um": 70, "mean_um": 85 },
    { "min": 3.0, "min_incl": false, "max": 6.0,  "max_incl": true,  "local_um": 55, "mean_um": 70 },
    { "min": 1.5, "min_incl": true,  "max": 3.0,  "max_incl": true,  "local_um": 45, "mean_um": 55 },
    { "min": 0.0, "min_incl": true,  "max": 1.5,  "max_incl": false, "local_um": 35, "mean_um": 45 }
  ],
  "castings": [
    { "min": 6.0, "min_incl": true,  "max": null, "max_incl": false, "local_um": 70, "mean_um": 80 },
    { "min": 0.0, "min_incl": true,  "max": 6.0,  "max_incl": false, "local_um": 60, "mean_um": 70 }
  ]
}
```

```json
// packages/engineering-config/asnzs4680.v1.json
{
  "standard": "AS/NZS 4680",
  "edition": "ISI_EDISI_YANG_DIVERIFIKASI",
  "verified_by": "NAMA_ENGINEER",
  "verified_at": "YYYY-MM-DD",
  "scope": "non-centrifuged articles",
  "rows": [
    { "min": 6.0, "min_incl": false, "max": null, "max_incl": false, "local_um": 70, "mean_um": 85 },
    { "min": 3.0, "min_incl": false, "max": 6.0,  "max_incl": true,  "local_um": 55, "mean_um": 70 },
    { "min": 1.5, "min_incl": false, "max": 3.0,  "max_incl": true,  "local_um": 45, "mean_um": 55 },
    { "min": 0.0, "min_incl": true,  "max": 1.5,  "max_incl": true,  "local_um": 35, "mean_um": 45 }
  ]
}
```

### 6.2 Tool: Coating Thickness Checker (Multi-Standard)

Input memakai **discriminated union** berdasarkan `standard`, sehingga field wajib berbeda per standar: ASTM A123 butuh `materialCategory`, ISO 1461 punya opsi `isCasting`.

```ts
// lib/tools/coating-thickness/schema.ts
import { z } from "zod";

const Readings = z.array(z.array(z.number().nonnegative()).min(1)).min(1);
// ASTM   → array per specimen,       isi = pembacaan dalam specimen tsb
// ISO/AS → array per reference area, isi = pembacaan dalam area tsb

export const ThicknessInput = z.discriminatedUnion("standard", [
  z.object({
    standard: z.literal("ASTM_A123"),
    materialCategory: z.enum(["STRUCTURAL_SHAPES", "STRIP_BAR", "PLATE", "PIPE_TUBING", "WIRE", "REINFORCING_BAR", "FORGINGS_CASTINGS"]),
    steelThickness: z.number().positive(),
    unit: z.enum(["mm", "in"]).default("mm"),
    readingsUm: Readings.optional(),   // per specimen
  }),
  z.object({
    standard: z.literal("ISO1461"),
    steelThicknessMm: z.number().positive().max(300),
    isCasting: z.boolean().default(false),
    readingsUm: Readings.optional(),   // per reference area
  }),
  z.object({
    standard: z.literal("ASNZS4680"),
    steelThicknessMm: z.number().positive().max(300),
    readingsUm: Readings.optional(),   // per reference area
  }),
]);

export type ThicknessInputT = z.infer<typeof ThicknessInput>;
```

```ts
// lib/tools/coating-thickness/range.ts
export interface Range {
  min: number; min_incl: boolean;
  max: number | null; max_incl?: boolean;
}

export const inRange = (t: number, r: Range) =>
  (r.min_incl ? t >= r.min : t > r.min) &&
  (r.max === null || (r.max_incl ? t <= r.max : t < r.max));

export const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
export const round1 = (x: number) => Math.round(x * 10) / 10;
```

```ts
// lib/tools/coating-thickness/astm-a123.ts
import cfg from "@galva/engineering-config/astm-a123.v1.json";
import { inRange, mean, round1 } from "./range";

type Category = keyof typeof cfg.table1;

export function checkAstmA123(input: {
  materialCategory: Category;
  steelThickness: number;
  unit: "mm" | "in";
  readingsUm?: number[][];
}) {
  const ranges = input.unit === "in"
    ? cfg.thickness_ranges.imperial_in
    : cfg.thickness_ranges.metric_mm;

  const range = ranges.find(r => inRange(input.steelThickness, r));
  if (!range) throw new Error("Ketebalan baja di luar rentang Table 1");

  const requiredGrade = (cfg.table1[input.materialCategory] as Record<string, number | null>)[range.id];
  if (requiredGrade === null) {
    // Sel "—" di Table 1: tidak ada persyaratan untuk kombinasi ini
    return {
      standard: `${cfg.standard} (${cfg.edition})`,
      materialCategory: input.materialCategory,
      thicknessRange: range.id,
      verdict: "NOT_DEFINED",
      note:
        "Table 1 ASTM A123-24 tidak menetapkan grade untuk kategori & rentang tebal ini. " +
        "Periksa apakah kategori sudah benar (Appendix X1.1), atau apakah produk " +
        "seharusnya mengacu ke ASTM A153 / A767. Konsultasikan dengan galvanizer.",
    };
  }
  const idx = cfg.grades.indexOf(requiredGrade);
  const individualMinGrade = idx > 0 ? cfg.grades[idx - 1] : null; // urutan Table 2

  const result: Record<string, unknown> = {
    standard: `${cfg.standard} (${cfg.edition})`,
    materialCategory: input.materialCategory,
    thicknessRange: range.id,
    requirement: {
      coatingGrade: requiredGrade,
      averageMinUm: requiredGrade,
      averageMinMils: cfg.grade_table[String(requiredGrade) as keyof typeof cfg.grade_table].mils,
      individualSpecimenMinUm: individualMinGrade, // null → butuh review manual
    },
    maxThickness: "Tidak ada batas maksimum di ASTM A123",
  };

  if (input.readingsUm?.length) {
    const specimenAvgs = input.readingsUm.map(mean);
    const lotAvg = mean(specimenAvgs);
    const failingSpecimens = individualMinGrade === null
      ? []
      : specimenAvgs
          .map((v, i) => ({ specimen: i + 1, avgUm: round1(v) }))
          .filter(s => s.avgUm < individualMinGrade);

    const lotPass = lotAvg >= requiredGrade;
    const indivPass = failingSpecimens.length === 0;

    result.measured = {
      specimenAveragesUm: specimenAvgs.map(round1),
      lotAverageUm: round1(lotAvg),
    };
    result.checks = { lotAverage: lotPass ? "PASS" : "FAIL", individualSpecimens: indivPass ? "PASS" : "FAIL" };
    result.failingSpecimens = failingSpecimens;
    result.verdict = lotPass && indivPass ? "CONFORMS" : "NON_CONFORMING";
  }

  result.note =
    "Screening berdasarkan Table 1 ASTM A123-24 memakai tebal baja TERUKUR " +
    "(bagian paling tipis untuk tapered/structural shapes, Appendix X1.2). " +
    "Jumlah specimen & titik ukur mengikuti klausul sampling A123 dan ASTM E376. " +
    "Assembly multi-material dievaluasi per kategori.";
  return result;
}
```

```ts
// lib/tools/coating-thickness/iso-family.ts
import iso1461 from "@galva/engineering-config/iso1461.v1.json";
import asnzs4680 from "@galva/engineering-config/asnzs4680.v1.json";
import { inRange, mean, round1 } from "./range";

export function checkIsoFamily(input: {
  standard: "ISO1461" | "ASNZS4680";
  steelThicknessMm: number;
  isCasting?: boolean;
  readingsUm?: number[][];
}) {
  const cfg = input.standard === "ISO1461" ? iso1461 : asnzs4680;
  const table = input.isCasting && "castings" in cfg ? cfg.castings : cfg.rows;
  const row = table.find(r => inRange(input.steelThicknessMm, r));
  if (!row) throw new Error("Ketebalan baja di luar tabel");

  const result: Record<string, unknown> = {
    standard: `${cfg.standard} (${cfg.edition})`,
    requirement: { localMinUm: row.local_um, meanMinUm: row.mean_um },
  };

  if (input.readingsUm?.length) {
    const locals = input.readingsUm.map(mean);           // local thickness per reference area
    const overallMean = mean(locals);
    const failingAreas = locals
      .map((v, i) => ({ area: i + 1, localUm: round1(v) }))
      .filter(a => a.localUm < row.local_um);

    const localPass = failingAreas.length === 0;
    const meanPass = overallMean >= row.mean_um;

    result.measured = { localThicknessesUm: locals.map(round1), meanUm: round1(overallMean) };
    result.checks = { local: localPass ? "PASS" : "FAIL", mean: meanPass ? "PASS" : "FAIL" };
    result.failingAreas = failingAreas;
    result.verdict = localPass && meanPass ? "CONFORMS" : "NON_CONFORMING";
  }

  result.note =
    "Screening. Jumlah & ukuran reference area mengikuti klausul sampling standar. " +
    "Artikel yang di-centrifuge memakai tabel berbeda (belum didukung v1).";
  return result;
}
```

```ts
// lib/tools/coating-thickness/index.ts
import { ThicknessInput } from "./schema";
import { checkAstmA123 } from "./astm-a123";
import { checkIsoFamily } from "./iso-family";

export function checkCoatingThickness(raw: unknown) {
  const input = ThicknessInput.parse(raw);   // validasi ketat, error jelas ke LLM/UI
  switch (input.standard) {
    case "ASTM_A123":
      return checkAstmA123(input);
    case "ISO1461":
    case "ASNZS4680":
      return checkIsoFamily(input);
  }
}
```

**Mode "Bandingkan standar"** (fitur UI): panggil tool dua kali dengan input baja yang sama, lalu tampilkan berdampingan — berguna untuk menjawab "kalau spek proyek pakai ASTM, apakah hasil galvanis yang lolos ISO tetap lolos?".

```ts
// lib/tools/coating-thickness/compare.ts
import { checkCoatingThickness } from "./index";

export function compareStandards(p: {
  steelThicknessMm: number;
  materialCategory: "STRUCTURAL_SHAPES" | "STRIP_BAR" | "PLATE" | "PIPE_TUBING" | "WIRE" | "REINFORCING_BAR" | "FORGINGS_CASTINGS";
}) {
  return {
    astmA123: checkCoatingThickness({
      standard: "ASTM_A123", materialCategory: p.materialCategory,
      steelThickness: p.steelThicknessMm, unit: "mm",
    }),
    iso1461:   checkCoatingThickness({ standard: "ISO1461",   steelThicknessMm: p.steelThicknessMm }),
    asnzs4680: checkCoatingThickness({ standard: "ASNZS4680", steelThicknessMm: p.steelThicknessMm }),
  };
}
```

### 6.3 Tool: Durability Estimator

```ts
// lib/tools/durability.ts
import zincRates from "@galva/engineering-config/iso9223-zinc.v1.json";
// { "C1": [0, 0.1], "C2": [0.1, 0.7], "C3": [0.7, 2.1], "C4": [2.1, 4.2], "C5": [4.2, 8.4], "CX": [8.4, 25] }

export function estimateLife(coatingUm: number, category: keyof typeof zincRates) {
  const [lo, hi] = zincRates[category];
  const best = lo === 0 ? Infinity : coatingUm / lo;
  const worst = coatingUm / hi;
  return {
    category,
    yearsRange: { worst: Math.round(worst), best: Number.isFinite(best) ? Math.round(best) : ">100" },
    method: "Linear consumption (ISO 9223 zinc first-year rates) — estimasi kasar",
    recommend: "Untuk proyek nyata gunakan GAA Durability Estimator / AGA LCCC dan data lokasi.",
  };
}
```

### 6.4 Tool: Steel Reactivity Screener

```ts
// lib/tools/steel-reactivity.ts
export function screenReactivity(siPct: number, pPct = 0) {
  const siEq = siPct + 2.5 * pPct;
  let zone: string, expectation: string;
  if (siEq < 0.04)        { zone = "LOW";        expectation = "Coating relatif tipis & mengkilap"; }
  else if (siEq <= 0.15)  { zone = "SANDELIN";   expectation = "Sangat reaktif: tebal, kusam, risiko getas"; }
  else if (siEq <= 0.22)  { zone = "MODERATE";   expectation = "Reaktivitas terkendali"; }
  else                    { zone = "HIGH";       expectation = "Tebal, abu-abu matte"; }
  return {
    siEquivalent: +siEq.toFixed(3), zone, expectation,
    disclaimer: "Batas zona bersifat indikatif; suhu bath & paduan (mis. Ni) juga berpengaruh.",
  };
}
```

### 6.5 Tool: Unit Converter

```ts
// lib/tools/units.ts
export const MICRON_PER_MIL = 25.4;
export const ZINC_DENSITY_G_CM3 = 7.14;          // → 1 µm zinc ≈ 7,14 g/m²
export const GM2_PER_OZFT2 = 305.15;

export const milToMicron = (mil: number) => mil * MICRON_PER_MIL;
export const micronToGm2 = (um: number) => um * ZINC_DENSITY_G_CM3;
export const ozft2ToGm2 = (oz: number) => oz * GM2_PER_OZFT2;
export const gm2ToMicron = (g: number) => g / ZINC_DENSITY_G_CM3;
```

### 6.6 Tool lain (fase 2)
- **Vent/Drain Hole Advisor** — input tipe & dimensi section → rekomendasi jumlah & posisi, tabel dari AS/NZS 4792 / ASTM A385 / publikasi AGA yang telah diverifikasi.
- **Zinc Pickup Estimator** — estimasi konsumsi zinc berdasarkan luas permukaan & target ketebalan.
- **Kettle Fit Checker** — cek dimensi item vs dimensi kettle galvanizer.
- **Defect Photo Triage** — upload foto → klasifikasi awal cacat (vision model) + rujukan ke kriteria inspeksi. Selalu berlabel "indikatif".

### 6.7 Unit test (contoh)

```ts
// tests/coating-thickness.test.ts
import { describe, it, expect } from "vitest";
import { checkCoatingThickness } from "@/lib/tools/coating-thickness";

const astm = (cat: string, t: number, unit: "mm" | "in" = "mm", readingsUm?: number[][]) =>
  checkCoatingThickness({ standard: "ASTM_A123", materialCategory: cat, steelThickness: t, unit, readingsUm }) as any;

describe("ASTM A123-24 — Table 1", () => {
  it("structural shapes 10 mm → Grade 100, individu min Grade 85 (Table 2)", () => {
    const r = astm("STRUCTURAL_SHAPES", 10);
    expect(r.requirement.coatingGrade).toBe(100);
    expect(r.requirement.individualSpecimenMinUm).toBe(85);
  });
  it("plate 10 mm → Grade 75 (revisi 2024, bukan 100)", () => {
    expect(astm("PLATE", 10).requirement.coatingGrade).toBe(75);
  });
  it("plate girder ½ in → Grade 75, rolled beam ½ in → Grade 100 (Appendix X1.1)", () => {
    expect(astm("PLATE", 0.5, "in").requirement.coatingGrade).toBe(75);
    expect(astm("STRUCTURAL_SHAPES", 0.5, "in").requirement.coatingGrade).toBe(100);
  });
  it("pole dari plat 5/8 in → Grade 100 (bukan pipe 75)", () => {
    expect(astm("PLATE", 0.625, "in").requirement.coatingGrade).toBe(100);
    expect(astm("PIPE_TUBING", 0.625, "in").requirement.coatingGrade).toBe(75);
  });
  it("strip & bar 20 mm → Grade 100", () => {
    expect(astm("STRIP_BAR", 20).requirement.coatingGrade).toBe(100);
  });
  it("structural shapes 5 mm (R4) → Grade 75 (sebelumnya 85)", () => {
    expect(astm("STRUCTURAL_SHAPES", 5).requirement.coatingGrade).toBe(75);
  });
  it("wire 2 mm → Grade 50", () => {
    expect(astm("WIRE", 2).requirement.coatingGrade).toBe(50);
  });
  // Boundary metric (A123M) — sesuaikan setelah verifikasi teks standar
  it("tepat 1,6 mm → R2 (Grade 65 plate)", () => {
    expect(astm("PLATE", 1.6).requirement.coatingGrade).toBe(65);
  });
  it("tepat 4,8 mm → R3 (Grade 75)", () => {
    expect(astm("STRUCTURAL_SHAPES", 4.8).requirement.coatingGrade).toBe(75);
  });
  it("tepat 6,4 mm → R5 (structural 100, plate 75)", () => {
    expect(astm("STRUCTURAL_SHAPES", 6.4).requirement.coatingGrade).toBe(100);
    expect(astm("PLATE", 6.4).requirement.coatingGrade).toBe(75);
  });
  it("tepat 16 mm → R6 (plate 100)", () => {
    expect(astm("PLATE", 16).requirement.coatingGrade).toBe(100);
  });
  // Kategori baru
  it("reinforcing bar 12 mm → Grade 100", () => {
    expect(astm("REINFORCING_BAR", 12).requirement.coatingGrade).toBe(100);
  });
  it("reinforcing bar 3 mm → NOT_DEFINED", () => {
    expect(astm("REINFORCING_BAR", 3).verdict).toBe("NOT_DEFINED");
  });
  it("forgings & castings 5 mm → Grade 100; 4 mm → NOT_DEFINED", () => {
    expect(astm("FORGINGS_CASTINGS", 5).requirement.coatingGrade).toBe(100);
    expect(astm("FORGINGS_CASTINGS", 4).verdict).toBe("NOT_DEFINED");
  });
  it("wire < 1/16 in → Grade 35, individu = null (review manual)", () => {
    const r = astm("WIRE", 0.05, "in");
    expect(r.requirement.coatingGrade).toBe(35);
    expect(r.requirement.individualSpecimenMinUm).toBeNull();
  });
  // Evaluasi pembacaan
  it("lot rata-rata OK tapi 1 specimen < Grade 85 → NON_CONFORMING", () => {
    const r = astm("STRUCTURAL_SHAPES", 10, "mm", [
      [130, 140, 135], [125, 128, 131], [80, 82, 79], // specimen 3 avg ≈ 80 < 85
    ]);
    expect(r.checks.lotAverage).toBe("PASS");
    expect(r.checks.individualSpecimens).toBe("FAIL");
    expect(r.verdict).toBe("NON_CONFORMING");
  });
  it("plate 10 mm rata-rata 90 µm → CONFORMS (Grade 75, individu min 65)", () => {
    const r = astm("PLATE", 10, "mm", [[90, 92, 88], [89, 91, 90]]);
    expect(r.verdict).toBe("CONFORMS");
  });
});

describe("ISO 1461", () => {
  const iso = (t: number, extra = {}) =>
    checkCoatingThickness({ standard: "ISO1461", steelThicknessMm: t, ...extra }) as any;

  it("plat 10 mm → local 70 / mean 85", () => {
    expect(iso(10).requirement).toEqual({ localMinUm: 70, meanMinUm: 85 });
  });
  it("tepat 6 mm → kelas >3 s/d ≤6", () => {
    expect(iso(6).requirement).toEqual({ localMinUm: 55, meanMinUm: 70 });
  });
  it("tepat 1,5 mm → kelas ≥1,5 s/d ≤3 (45/55)", () => {
    expect(iso(1.5).requirement).toEqual({ localMinUm: 45, meanMinUm: 55 });
  });
  it("casting 8 mm → 70/80", () => {
    expect(iso(8, { isCasting: true }).requirement).toEqual({ localMinUm: 70, meanMinUm: 80 });
  });
  it("satu reference area di bawah local → NON_CONFORMING", () => {
    const r = iso(10, { readingsUm: [[95, 100], [90, 92], [60, 65]] });
    expect(r.checks.local).toBe("FAIL");
  });
});

describe("AS/NZS 4680", () => {
  const as = (t: number) =>
    checkCoatingThickness({ standard: "ASNZS4680", steelThicknessMm: t }) as any;

  it("tepat 1,5 mm → kelas ≤1,5 (35/45) — beda dengan ISO 1461", () => {
    expect(as(1.5).requirement).toEqual({ localMinUm: 35, meanMinUm: 45 });
  });
  it("plat 10 mm → 70/85", () => {
    expect(as(10).requirement).toEqual({ localMinUm: 70, meanMinUm: 85 });
  });
});

describe("Validasi input", () => {
  it("ASTM tanpa materialCategory → error", () => {
    expect(() => checkCoatingThickness({ standard: "ASTM_A123", steelThickness: 10 })).toThrow();
  });
});
```

> Boundary test (ASTM: 1,6 / 3,2 / 4,8 / 6,4 / 16 mm; ISO & AS/NZS: 1,5 / 3 / 6 mm) wajib ada — di lapangan, salah kelas di batas ini adalah sumber sengketa inspeksi yang paling sering. Setelah verifikasi ke edisi standar, **update test dulu, baru config**.

---

## 7. Desain AI: System Prompt, Tool Calling, Guardrails

### 7.1 System prompt (inti)

```text
Kamu adalah GalvaAI, asisten teknis hot dip galvanizing (batch/after-fabrication).
Gaya: seperti metallurgical engineer senior — jelas, praktis, jujur soal batasan.

ATURAN SUMBER
- Jawab HANYA berdasarkan <context> hasil retrieval dan hasil tool.
- Cantumkan sitasi [AGA] / [GAA] + URL untuk setiap klaim teknis.
- Jika konteks tidak cukup, katakan terus terang dan sarankan menghubungi
  galvanizer atau asosiasi terkait. Jangan mengarang angka.

ATURAN STANDAR
- Standar yang didukung untuk ketebalan coating: ASTM_A123, ISO1461, ASNZS4680.
- <selected_standard> berisi pilihan user di UI. Jika terisi, gunakan HANYA
  standar itu. Jika user menyebut standar lain di chat, ikuti yang disebut di chat.
- Bedakan ASTM (AGA) vs ISO 1461 / AS/NZS 4680 (GAA). Jangan campur angka.
- ASTM A123 mengacu edisi A123/A123M-24. Butuh KATEGORI MATERIAL:
  structural shapes, strip & bar, plate, pipe & tubing, wire,
  reinforcing bar, forgings & castings. Jika belum jelas, tanyakan dulu.
- Tentukan kategori berdasarkan cara produk dibuat, bukan tampilannya
  (Appendix X1.1): plate girder & angle dari plat las = PLATE; pole dari
  plat bending = PLATE; handrail = PIPE & TUBING; bar grating = STRIP & BAR.
- Gunakan tebal baja TERUKUR; untuk tapered / flange-web berbeda tebal,
  pakai bagian paling tipis (Appendix X1.2).
- "Satu grade di bawah" diambil dari urutan Table 2 (mis. 100 → 85).
- Jika standar belum dipilih/disebut, tanyakan satu pertanyaan klarifikasi
  ATAU gunakan tool perbandingan dan tampilkan semua dengan label jelas.
- Baut/mur/hardware yang di-centrifuge → ASTM A153, bukan A123.

ATURAN ANGKA
- Semua perhitungan (ketebalan, umur, konversi, reaktivitas) WAJIB lewat tool.
- Sajikan estimasi umur sebagai rentang, bukan satu angka.

ATURAN KESELAMATAN
- Rongga tertutup tanpa vent = risiko ledakan di kettle. Selalu tekankan.
- Baja kekuatan sangat tinggi / komponen kritis: rujuk ASTM A143 dan
  sarankan konsultasi engineer.
- Asisten ini bersifat edukatif; keputusan desain/inspeksi final ada pada
  engineer & inspector yang berwenang.

BAHASA
- Jawab dalam Bahasa Indonesia; pertahankan istilah teknis Inggris
  (mis. "wet storage stain", "venting") dengan penjelasan singkat.
```

### 7.2 Tool definitions (Claude tool use)

```ts
export const tools = [
  {
    name: "check_coating_thickness",
    description:
      "Cek persyaratan ketebalan coating HDG minimum dan screening hasil ukur. " +
      "Standar: ASTM_A123 (wajib materialCategory + steelThickness + unit), " +
      "ISO1461 atau ASNZS4680 (wajib steelThicknessMm). " +
      "readingsUm = array of arrays: per specimen (ASTM) atau per reference area (ISO/AS).",
    input_schema: {
      type: "object",
      properties: {
        standard: { type: "string", enum: ["ASTM_A123", "ISO1461", "ASNZS4680"] },
        materialCategory: {
          type: "string",
          enum: ["STRUCTURAL_SHAPES", "STRIP_BAR", "PLATE", "PIPE_TUBING", "WIRE", "REINFORCING_BAR", "FORGINGS_CASTINGS"],
          description: "Wajib untuk ASTM_A123",
        },
        steelThickness: { type: "number", description: "Untuk ASTM_A123" },
        unit: { type: "string", enum: ["mm", "in"], description: "Untuk ASTM_A123, default mm" },
        steelThicknessMm: { type: "number", description: "Untuk ISO1461 / ASNZS4680" },
        isCasting: { type: "boolean", description: "Hanya ISO1461" },
        readingsUm: {
          type: "array",
          items: { type: "array", items: { type: "number" } },
        },
      },
      required: ["standard"],   // field lain divalidasi Zod per standar
    },
  },
  {
    name: "compare_thickness_standards",
    description: "Bandingkan persyaratan ketebalan ASTM A123 vs ISO 1461 vs AS/NZS 4680 untuk baja yang sama.",
    input_schema: {
      type: "object",
      properties: {
        steelThicknessMm: { type: "number" },
        materialCategory: {
          type: "string",
          enum: ["STRUCTURAL_SHAPES", "STRIP_BAR", "PLATE", "PIPE_TUBING", "WIRE", "REINFORCING_BAR", "FORGINGS_CASTINGS"],
        },
      },
      required: ["steelThicknessMm", "materialCategory"],
    },
  },
  {
    name: "estimate_durability",
    description: "Estimasi rentang umur coating berdasarkan ketebalan (µm) dan kategori korosivitas ISO 9223.",
    input_schema: {
      type: "object",
      properties: {
        coatingUm: { type: "number" },
        category: { type: "string", enum: ["C1", "C2", "C3", "C4", "C5", "CX"] },
      },
      required: ["coatingUm", "category"],
    },
  },
  {
    name: "screen_steel_reactivity",
    description: "Screening reaktivitas baja terhadap zinc berdasarkan %Si dan %P (Sandelin).",
    input_schema: {
      type: "object",
      properties: { siPct: { type: "number" }, pPct: { type: "number" } },
      required: ["siPct"],
    },
  },
  {
    name: "search_knowledge",
    description: "Cari dokumen AGA/GAA yang relevan.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string" },
        standard: { type: "string", enum: ["ASTM", "ISO/ASNZS"] },
      },
      required: ["query"],
    },
  },
];
```

### 7.3 Orchestrator (route handler)

```ts
// app/api/chat/route.ts (ringkas, pseudo)
export async function POST(req: Request) {
  const { messages, selectedStandard } = await req.json();
  // selectedStandard: "ASTM_A123" | "ISO1461" | "ASNZS4680" | null (dari selector UI)
  await rateLimit(req);
  const SYSTEM_PROMPT = `${BASE_PROMPT}\n<selected_standard>${selectedStandard ?? "BELUM_DIPILIH"}</selected_standard>`;

  let convo = [...messages];
  for (let step = 0; step < 5; step++) {                 // batasi loop tool
    const res = await anthropic.messages.create({
      model: "claude-sonnet-5",
      system: SYSTEM_PROMPT,
      tools,
      max_tokens: 1500,
      messages: convo,
    });
    if (res.stop_reason !== "tool_use") return streamToClient(res);

    const toolResults = await Promise.all(
      res.content.filter(b => b.type === "tool_use").map(async b => ({
        type: "tool_result",
        tool_use_id: b.id,
        content: JSON.stringify(await runTool(b.name, b.input)), // validasi Zod di dalam
      }))
    );
    convo.push({ role: "assistant", content: res.content },
               { role: "user", content: toolResults });
  }
  return fallbackAnswer();
}
```

### 7.4 Guardrails tambahan
- **Prompt injection dari konten crawl**: teks dokumen dibungkus `<context>` dan diperlakukan sebagai data, bukan instruksi.
- **Out-of-domain**: pertanyaan di luar galvanizing/korosi dijawab singkat dan diarahkan kembali.
- **Confidence flag**: bila skor re-rank rendah → jawaban diberi label "informasi terbatas".
- **Logging**: simpan query, dokumen yang diambil, tool call, feedback (tanpa data pribadi).

---

## 8. Struktur Halaman Web (Knowledge Hub)

```
/                      Landing: apa itu HDG, CTA "Tanya GalvaAI"
/learn
  /corrosion           Dasar korosi & ISO 9223
  /process             9 tahap proses (diagram interaktif)
  /metallurgy          Lapisan Gamma–Delta–Zeta–Eta
  /steel-selection     Si, P, Sandelin
  /design              Venting, distorsi, welding, masking
  /specifications      ASTM vs ISO vs AS/NZS (tabel pembanding)
  /inspection          Kriteria terima/tolak + galeri cacat
  /repair              ASTM A780, metode repair
  /duplex              Cat & powder di atas HDG
  /durability          Umur layanan & LCC
/glossary              Istilah (EN ↔ ID)
/tools                 Kalkulator (§6)
/chat                  AI Assistant
/sources               Daftar sumber & atribusi
```

**Komponen UI chat:**
- Streaming jawaban + kartu sitasi (judul, sumber AGA/GAA, link).
- Badge "dihitung oleh tool" pada angka hasil kalkulator.
- Suggested questions per halaman (kontekstual).
- **Selector standar** (lihat di bawah) — disimpan di state & dikirim ke `/api/chat`.
- Tombol feedback 👍/👎 + alasan.

**Komponen Standard Selector & halaman `/tools/coating-thickness`:**

```
┌─ Standar ketebalan coating ───────────────────────────────┐
│ ( ) ASTM A123     ( ) ISO 1461     ( ) AS/NZS 4680        │
│ [ ] Bandingkan ketiganya                                  │
├───────────────────────────────────────────────────────────┤
│ Jika ASTM A123:                                           │
│   Kategori material [Structural Shapes ▼] (7 pilihan)     │
│   Tebal baja terukur [ 10 ] [mm ▼ | in] ⓘ bagian tertipis │
│ Jika ISO 1461:                                            │
│   Tebal baja [ 10 ] mm   [ ] Casting                      │
│ Jika AS/NZS 4680:                                         │
│   Tebal baja [ 10 ] mm                                    │
├───────────────────────────────────────────────────────────┤
│ Pembacaan (opsional): + Specimen / + Reference area       │
│   #1 [130] [140] [135]                                    │
├───────────────────────────────────────────────────────────┤
│ HASIL:  ASTM A123 → Grade 100 (100 µm / 3,9 mils)         │
│         Individu min: Grade 85 · Verdict: CONFORMS ✅     │
│         Sumber: ASTM A123/A123M (edisi …)                 │
└───────────────────────────────────────────────────────────┘
```

```tsx
// components/StandardSelector.tsx (ringkas)
"use client";
export type ThicknessStandard = "ASTM_A123" | "ISO1461" | "ASNZS4680";

const OPTIONS: { value: ThicknessStandard; label: string; hint: string }[] = [
  { value: "ASTM_A123", label: "ASTM A123-24", hint: "Grade per kategori material (AGA)" },
  { value: "ISO1461",   label: "ISO 1461",  hint: "Local & mean, internasional" },
  { value: "ASNZS4680", label: "AS/NZS 4680", hint: "Australia & NZ (GAA)" },
];

export function StandardSelector({ value, onChange }: {
  value: ThicknessStandard | null;
  onChange: (v: ThicknessStandard) => void;
}) {
  return (
    <div role="radiogroup" aria-label="Standar ketebalan coating" className="grid gap-2 sm:grid-cols-3">
      {OPTIONS.map(o => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg border p-3 text-left ${value === o.value ? "border-zinc-900 bg-zinc-100" : "border-zinc-300"}`}
        >
          <div className="font-medium">{o.label}</div>
          <div className="text-xs text-zinc-500">{o.hint}</div>
        </button>
      ))}
    </div>
  );
}
```

Pilihan standar juga disimpan di URL (`?std=ASTM_A123`) supaya hasil kalkulasi bisa dibagikan, dan field form berubah otomatis sesuai standar (field kategori material hanya muncul untuk ASTM).

---

## 9. Data Model & API

```sql
create extension if not exists vector;

create table documents (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('AGA','GAA')),
  url text unique not null,
  title text,
  section text,
  content_hash text not null,
  fetched_at timestamptz default now()
);

create table chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  chunk_index int,
  text text not null,
  standard_family text,
  topics text[],
  embedding vector(1024),
  tsv tsvector generated always as (to_tsvector('english', text)) stored
);
create index on chunks using hnsw (embedding vector_cosine_ops);
create index on chunks using gin (tsv);

create table chat_logs (
  id uuid primary key default gen_random_uuid(),
  question text,
  retrieved_chunk_ids uuid[],
  tool_calls jsonb,
  answer text,
  feedback smallint,          -- -1, 0, 1
  created_at timestamptz default now()
);
```

| Endpoint | Method | Fungsi |
|---|---|---|
| `/api/chat` | POST | Chat dengan RAG + tools (streaming) |
| `/api/tools/thickness` | POST | Coating thickness checker |
| `/api/tools/durability` | POST | Durability estimator |
| `/api/tools/reactivity` | POST | Steel reactivity screener |
| `/api/feedback` | POST | Simpan feedback |
| `/api/admin/reindex` | POST | Trigger re-ingestion (protected) |

---

## 10. Evaluasi Kualitas Jawaban

### 10.1 Golden set (contoh — target ≥ 150 pertanyaan)

| # | Pertanyaan | Poin wajib ada di jawaban |
|---|---|---|
| 1 | Berapa ketebalan minimum HDG plat 12 mm menurut ISO 1461? | Local 70 µm, mean 85 µm, via tool, sitasi |
| 2 | Kenapa hasil galvanis saya abu-abu kusam? | Si/P, Sandelin, bukan cacat bila spek terpenuhi |
| 3 | Hollow section boleh dicelup tanpa lubang? | **Tidak** — risiko ledakan, venting wajib |
| 4 | Apakah white rust membuat produk reject? | Tergantung tingkat; ringan umumnya accept |
| 5 | Bisakah HDG dicat? | Ya, duplex; persiapan ASTM D6386/D7803 |
| 6 | Baut HDG, mur perlu apa? | Overtapping |
| 7 | HDG 85 µm di lingkungan C4 tahan berapa lama? | Rentang via tool + rujuk estimator GAA |
| 8 | Bagaimana memperbaiki goresan HDG di lapangan? | ASTM A780: zinc-rich paint / solder / metallizing |
| 9 | Beda ASTM A123 dan A153? | Fabricated products vs hardware/fastener |
| 10 | Apa itu lapisan Zeta? | FeZn13, ~6% Fe, kolumnar |
| 11 | Ketebalan minimum ASTM A123 untuk rolled WF beam, web 9 mm, flange 14 mm? | Structural shapes, pakai bagian tertipis (web 9 mm) → Grade 100, individu min Grade 85 |
| 12 | Pipa 8 mm, standar ASTM A123, berapa minimumnya? | Grade 75 — pipe & tubing, bukan 100 |
| 13 | Baja 10 mm rata-rata 90 µm lolos ISO 1461, apakah lolos ASTM A123? | Tergantung kategori: plate → lolos (Grade 75); structural shapes → tidak (Grade 100) |
| 17 | Plate girder tebal ½ in pakai grade berapa di A123? | Kategori PLATE (bukan structural shapes) → Grade 75 |
| 18 | Pole dari plat bending 5/8 in, grade A123? | Kategori PLATE → Grade 100, bukan pipe & tubing |
| 19 | Rebar 3 mm menurut A123 Table 1? | Tidak didefinisikan → arahkan cek kategori / ASTM A767 |
| 20 | Area masking dihitung dalam batas repair? | Tidak — bukan accessible surface area (A123-24) |
| 14 | Berapa ketebalan minimum untuk plat 8 mm? (tanpa standar) | AI bertanya standar ATAU tampilkan ketiganya berlabel |
| 15 | ASTM A123 minta ketebalan untuk baut M16? | Arahkan ke ASTM A153, bukan A123 |
| 16 | Plat 1,5 mm menurut ISO 1461 vs AS/NZS 4680? | Tampilkan perbedaan kelas di batas 1,5 mm + catatan verifikasi |

### 10.2 Metrik
- **Faithfulness** (jawaban didukung konteks) — target ≥ 0,9
- **Citation accuracy** (link benar-benar relevan) — target ≥ 0,9
- **Numeric correctness** (angka = output tool / standar) — target 100%
- **Standard mix-up rate** — target 0%
- **Safety recall** (venting, embrittlement disebut saat relevan) — target 100%
- Review manual oleh engineer: sampel 30 chat/minggu.

---

## 11. Legal, Hak Cipta & Etika Konten

Ini **bukan formalitas** — kedua situs adalah konten berhak cipta milik asosiasi.

1. **Baca & patuhi** *Terms of Use* AGA dan *Disclaimer* GAA sebelum crawling. Idealnya **kirim email permohonan izin** ke kedua asosiasi (kontak tersedia di situs masing-masing) — asosiasi industri sering terbuka untuk inisiatif edukasi, apalagi bila disertai atribusi.
2. **Jangan menampilkan ulang halaman secara utuh.** Konten hub ditulis ulang (parafrase & ringkas) dengan bahasa sendiri; kutipan langsung dibatasi dan selalu ditautkan.
3. **Atribusi jelas** di setiap jawaban dan di halaman `/sources`.
4. **Publikasi PDF** (technical publications) hanya digunakan jika izin/lisensi mengizinkan; jika tidak, cukup ditautkan.
5. **Teks standar ASTM/ISO/AS/NZS berhak cipta** — jangan dimuat utuh. Yang disimpan hanya nilai yang diperlukan tool, dari salinan standar yang dibeli secara sah.
6. **Kalkulator milik AGA/GAA** (LCCC, Durability Estimator) dirujuk via link, tidak di-clone.
7. **Disclaimer** di footer & chat: informasi edukatif, bukan pengganti engineer/inspector berwenang.
8. **Logo & merek** AGA/GAA tidak dipakai tanpa izin; jangan mengesankan afiliasi resmi.

---

## 12. Roadmap Pengembangan

| Fase | Durasi (est.) | Output |
|---|---|---|
| **0 – Persiapan** | 1–2 minggu | Izin/ToS review, taksonomi, verifikasi tabel standar |
| **1 – MVP** | 3–4 minggu | Ingestion AGA+GAA, chat RAG + sitasi, 3 kalkulator, 10 halaman hub |
| **2 – Kualitas** | 3 minggu | Hybrid search + rerank, golden set 150, dashboard eval, glosarium ID–EN |
| **3 – Pro features** | 4–6 minggu | Vent advisor, defect photo triage, export laporan PDF, konteks Indonesia (iklim & praktik lokal) |
| **4 – Monetisasi (opsional)** | — | Paket untuk fabricator/galvanizer: quota chat, white-label, integrasi QC |

---

## 13. Lampiran: Glosarium & Konversi Satuan

### 13.1 Glosarium EN ↔ ID

| Istilah | Penjelasan singkat |
|---|---|
| Kettle | Bak zinc cair |
| Pickling | Pembersihan asam untuk menghilangkan karat & mill scale |
| Flux | Larutan garam (zinc ammonium chloride) pencegah oksidasi sebelum celup |
| Dross | Endapan Zn–Fe di dasar kettle |
| Ash | Oksida zinc di permukaan bath |
| Bare spot | Area tidak terlapis |
| Wet storage stain / white rust | Noda putih akibat lembap tanpa sirkulasi udara |
| Venting / drainage | Lubang untuk keluar-masuk udara & zinc |
| Sandelin effect | Lonjakan reaktivitas baja pada rentang Si tertentu |
| Duplex system | HDG + cat/powder coating |
| Time to first maintenance | Waktu hingga perlu perawatan pertama |
| Overtapping | Pembesaran ulir mur untuk baut galvanis |
| Centrifuging / spinning | Pemutaran komponen kecil untuk membuang zinc berlebih |
| Progressive dipping | Pencelupan bertahap untuk item melebihi panjang kettle |
| Patina | Lapisan produk korosi zinc yang stabil & protektif |

### 13.2 Konversi satuan

| Dari | Ke | Faktor |
|---|---|---|
| 1 mil | µm | 25,4 |
| 1 µm zinc | g/m² | ≈ 7,14 |
| 1 oz/ft² | g/m² | ≈ 305 |
| 1 oz/ft² | µm | ≈ 43 (≈ 1,7 mils) |
| °F → °C | — | (°F − 32) × 5/9 |

---

> **Catatan penutup dari sisi engineer:** kekuatan produk ini bukan di chatbot-nya, tapi di **disiplin data**: tabel standar terverifikasi, pemisahan ASTM vs ISO yang ketat, kalkulator yang teruji di titik batas, dan sitasi yang bisa dicek user. Jawaban yang "terdengar pintar" tapi salah satu angka ketebalan bisa berujung pada sengketa inspeksi — jadi perlakukan setiap angka sebagai *engineering deliverable*.
