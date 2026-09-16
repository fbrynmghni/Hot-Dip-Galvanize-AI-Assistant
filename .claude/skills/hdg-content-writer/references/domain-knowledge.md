# Fondasi Domain HDG

Materi dasar untuk halaman `/learn`, FAQ, dan penyusunan test set evaluasi.
Angka standar **tidak** ada di sini — lihat
`../../hdg-standards-config/references/`.

---

## 1. Tahapan Proses Batch HDG

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

### Poin kritis dari pengalaman lapangan

- **Surface preparation adalah penyebab #1 cacat.** Zinc tidak bereaksi dengan
  permukaan yang tidak bersih; hasilnya *bare spot*. Cat, weld slag, dan
  anti-spatter berbasis silikon **tidak hilang** di degreasing/pickling — harus
  dihilangkan secara mekanis (blasting/grinding) di fabricator.
- **Over-pickling** → permukaan kasar dan risiko hidrogen pada baja berkekuatan
  tinggi.
- **Flux terkontaminasi besi** → dross meningkat, konsumsi zinc naik, ash tinggi.
- **Immersion time** umumnya beberapa menit; lebih lama tidak selalu lebih baik.
  Pada baja reaktif, ketebalan tumbuh hampir linear (tidak parabolik).

---

## 2. Metalurgi Coating: Lapisan Intermetalik Zn–Fe

| Lapisan | Fase | Kandungan Fe (±) | Kekerasan (DPN, ±) | Karakter |
|---|---|---|---|---|
| **Eta (η)** | Zn murni | ~0% | ~70 | Paling luar, ulet, memberi kilap |
| **Zeta (ζ)** | FeZn13 | ~6% | ~179 | Kristal kolumnar |
| **Delta (δ)** | FeZn7 / FeZn10 | ~7–12% | ~244 | Kompak |
| **Gamma (Γ)** | Fe3Zn10 | ~21–28% | ~250 | Sangat tipis, menempel ke baja |
| Base steel | — | — | ~159 | — |

Implikasi praktis:

- Lapisan intermetalik **lebih keras dari baja dasar** → ketahanan abrasi dan
  impact tinggi.
- Coating terikat secara **metalurgi** (bukan mekanis seperti cat), sehingga
  adhesinya sangat tinggi.
- **Cathodic protection**: zinc bersifat anodik terhadap baja, jadi goresan
  kecil tetap terlindungi (sacrificial).
- **Barrier protection**: patina zinc (zinc oxide → zinc hydroxide → zinc
  carbonate) terbentuk seiring waktu dan memperlambat laju korosi.

---

## 3. Kimia Baja & Reaktivitas (Sandelin Effect)

Kandungan **Silikon (Si)** dan **Fosfor (P)** sangat memengaruhi tampilan dan
ketebalan coating.

| Rentang Si (± umum) | Perilaku | Tampilan tipikal |
|---|---|---|
| < 0,04% | Low reactivity | Mengkilap, coating relatif tipis |
| 0,04–0,15% | **Sandelin range** — sangat reaktif | Tebal, kusam abu-abu, rawan getas/flaking |
| 0,15–0,22% | Reaktivitas moderat/terkendali | Relatif baik |
| > 0,22% | Reaktivitas naik lagi | Tebal, abu-abu matte |

- Indikator praktis yang sering dipakai: **Si + 2,5 × P** (fosfor memperkuat
  efek silikon).
- **Coating abu-abu kusam bukan cacat** secara spesifikasi, selama ketebalan dan
  adhesi memenuhi. Ketahanan korosinya sebanding atau lebih baik karena lebih
  tebal. Ini salah satu kesalahpahaman paling sering di lapangan — nyatakan
  eksplisit setiap kali relevan.
- Mencampur baja berbeda kimia dalam satu assembly → **tampilan tidak seragam**.
  Perlu dikomunikasikan ke owner sejak awal, terutama untuk AESS.

---

## 4. Design & Fabrication for HDG

### 4.1 Venting & drainage — isu keselamatan

Wajib untuk hollow section, tangki, pipa, dan rangka tertutup.

- Fungsi: udara/uap keluar, zinc masuk dan mengalir keluar, cegah flux/asam
  terjebak.
- **Keselamatan:** rongga tertutup tanpa vent dapat **meledak** di kettle —
  uap air/udara mengembang pada ±450 °C. Ini isu safety, bukan sekadar kualitas.
- Posisi vent di sudut diagonal: paling atas dan paling bawah saat dicelup.

### 4.2 Distorsi & warpage (ASTM A384)

- Hindari kombinasi tebal–tipis ekstrem dalam satu assembly.
- Desain simetris; hindari residual stress tinggi dari pengelasan.

### 4.3 Pengelasan

- Bersihkan slag total; hindari anti-spatter berbasis silikon.
- Komposisi weld metal (Si tinggi) dapat menyebabkan tampilan dan ketebalan
  berbeda di area las.

### 4.4 Ukuran kettle

Cek dimensi kettle galvanizer. Item terlalu panjang memerlukan
*progressive/double dipping*, dengan konsekuensi pada tampilan dan distorsi.

### 4.5 Embrittlement (ASTM A143)

- **Hydrogen embrittlement:** risiko pada baja kekuatan sangat tinggi; berasal
  dari proses pickling.
- **Strain-age embrittlement:** pada baja yang di-cold work berat.
- **LMAC (Liquid Metal Assisted Cracking):** jarang; terkait tegangan tinggi
  dan kondisi tertentu.

### 4.6 Lain-lain

- **Dissimilar metals** — kontak dengan tembaga/kuningan/stainless di lingkungan
  basah → galvanic corrosion pada zinc; gunakan isolasi.
- **Masking** — area yang tidak boleh terlapis (faying surface slip-critical
  tertentu, ulir) dirancang sejak awal.
- **Fastener** — baut HDG butuh *overtapping* mur; ulirnya di-centrifuge.

---

## 5. Inspeksi & Kriteria Penerimaan

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
| Flaking / peeling | Reject | Coating terlalu tebal/getas, atau masalah adhesi |

**Metode pengukuran:** magnetic thickness gauge (paling umum), stripping/weigh
(massa per luas), mikroskopi cross-section (destruktif). Jumlah dan distribusi
titik ukur mengikuti standar yang dipakai.

**Repair (ASTM A780):** zinc-rich paint, zinc-based solder, atau zinc
metallizing (thermal spray). Ketebalan repair umumnya disyaratkan lebih tebal
dari coating sekitarnya.

---

## 6. Post-Galvanizing

- **Duplex system** (HDG + cat/powder): efek sinergi — umur gabungan lebih
  panjang dari penjumlahan masing-masing. Persiapan permukaan wajib mengikuti
  ASTM D6386 (cat) / D7803 (powder), mis. sweep blasting ringan. Hindari cat
  alkyd langsung di atas zinc (saponifikasi).
- **Temperatur servis:** HDG umumnya aman untuk paparan kontinu hingga sekitar
  200 °C; di atas itu risiko pemisahan lapisan meningkat.
- **Penyimpanan:** hindari menumpuk rapat di kondisi lembap tanpa sirkulasi
  udara — penyebab wet storage stain.
- **Beton:** HDG rebar kompatibel. Reaksi awal zinc–semen basah menghasilkan
  hidrogen singkat, umumnya dikelola dengan passivasi (chromate atau alternatif).

---

## 7. Troubleshooting Matrix

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

## 8. Peta Standar per Area

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

---

## 9. Di Luar Scope v1

Disebut hanya sebagai pembanding, tidak dibahas mendalam:

- Continuous galvanizing (sheet/coil, ASTM A653)
- Electrogalvanizing, sherardizing, mechanical plating
- Konsultasi legal/kontrak & sertifikasi resmi
