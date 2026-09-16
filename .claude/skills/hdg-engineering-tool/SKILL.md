---
name: hdg-engineering-tool
description: This skill should be used when the user asks to "buat kalkulator", "tambah tool", "bikin vent hole advisor", "zinc pickup estimator", "unit converter", "kettle fit checker", "tool baru untuk chat", "perbaiki perhitungan ketebalan", or works on files under lib/tools/, /api/tools/, atau tool definition untuk Claude. Resep membangun kalkulator engineering deterministik GalvaAI.
version: 0.1.0
---

# Membangun Engineering Tool Deterministik

Di GalvaAI, **LLM tidak pernah menghitung angka engineering**. Setiap angka
yang muncul di jawaban chat, di halaman kalkulator, atau di halaman konten
berasal dari fungsi murni yang teruji dan membaca tabel dari config terversi.

Alasannya bukan estetika arsitektur: angka ketebalan yang salah berujung pada
sengketa inspeksi. Jawaban yang "terdengar pintar" tapi salah satu angkanya
lebih berbahaya daripada jawaban yang mengaku tidak tahu.

## Resep 7 langkah

### 1. Skema Zod dulu, sebelum satu baris logika

Gunakan `z.discriminatedUnion` bila field wajib berbeda per varian. ASTM A123
butuh `materialCategory`; ISO 1461 punya `isCasting`. Membuat keduanya sebagai
field opsional di satu objek datar akan meloloskan input tak lengkap ke dalam
logika, dan LLM tidak mendapat pesan error yang berguna.

```ts
export const ThicknessInput = z.discriminatedUnion("standard", [
  z.object({
    standard: z.literal("ASTM_A123"),
    materialCategory: z.enum([...]),      // wajib hanya di cabang ini
    steelThickness: z.number().positive(),
    unit: z.enum(["mm", "in"]).default("mm"),
    readingsUm: Readings.optional(),
  }),
  z.object({
    standard: z.literal("ISO1461"),
    steelThicknessMm: z.number().positive().max(300),
    isCasting: z.boolean().default(false),
    readingsUm: Readings.optional(),
  }),
]);
```

Validasi dijalankan di **pintu masuk** (`parse`, bukan `safeParse` yang
diabaikan). Error Zod dikembalikan apa adanya ke LLM — pesannya menyebut field
mana yang kurang, dan itu yang membuat LLM bertanya balik ke user alih-alih
menebak.

### 2. Angka dibaca dari config, tidak pernah di-hardcode

```ts
import cfg from "@galva/engineering-config/astm-a123.v1.json";
```

Tidak ada angka ketebalan, laju korosi, atau batas rentang yang ditulis langsung
di file logika. Kalau sebuah angka muncul di kode tool, itu bug — pindahkan ke
config. Lihat skill `hdg-standards-config` untuk aturan config.

Teruskan status verifikasi config ke output:

```ts
if (cfg.unverified) result.unverified = true;
```

### 3. Pure function — tanpa I/O, tanpa network, tanpa waktu

Fungsi tool menerima objek, mengembalikan objek. Tidak membaca env, tidak
memanggil API, tidak memakai `Date.now()`. Ini yang membuatnya bisa diuji
secara menyeluruh dan hasilnya reprodusibel saat dipakai memverifikasi laporan
inspeksi lama.

Route handler dan UI memanggil fungsi murni yang **sama**. Tidak boleh ada dua
implementasi perhitungan yang sama di dua tempat.

### 4. Unit test titik batas — ditulis sebelum implementasi

Titik batas wajib punya test. Ini bukan formalitas: salah kelas di batas adalah
sumber sengketa inspeksi paling sering di lapangan.

| Standar | Titik batas yang wajib diuji |
|---|---|
| ASTM A123M | 1,6 · 3,2 · 4,8 · 6,4 · 16,0 mm |
| ASTM A123 | 1/16 · 1/8 · 3/16 · 1/4 · 5/8 in |
| ISO 1461 | 1,5 · 3,0 · 6,0 mm |
| AS/NZS 4680 | 1,5 · 3,0 · 6,0 mm |

Selain boundary, uji juga kasus yang menangkap kesalahan kategori — mis. plate
10 mm → 75 sementara structural shapes 10 mm → 100. Pola lengkap ada di
`references/test-patterns.md`.

### 5. Sel kosong → `NOT_DEFINED`, bukan tebakan

Saat kombinasi input tidak dicakup tabel, kembalikan verdict eksplisit beserta
arahan yang berguna:

```ts
return {
  verdict: "NOT_DEFINED",
  note: "Table 1 ASTM A123-24 tidak menetapkan grade untuk kategori & rentang ini. "
      + "Periksa apakah kategori sudah benar (Appendix X1.1), atau apakah produk "
      + "seharusnya mengacu ke ASTM A153 / A767. Konsultasikan dengan galvanizer.",
};
```

Tidak ada interpolasi, tidak ada ekstrapolasi, tidak ada "pakai baris terdekat".
Hal yang sama berlaku untuk input di luar cakupan config (mis. artikel
centrifuged pada tabel non-centrifuged): tolak, jangan dekati.

### 6. Daftarkan sebagai tool definition Claude

`description` harus menyebut **field wajib per varian**, karena itulah yang
dibaca LLM saat memutuskan apakah informasinya sudah cukup:

```
"Standar: ASTM_A123 (wajib materialCategory + steelThickness + unit),
 ISO1461 atau ASNZS4680 (wajib steelThicknessMm).
 readingsUm = array of arrays: per specimen (ASTM) atau per reference area (ISO/AS)."
```

Definisi lengkap kelima tool v1 ada di
`../hdg-chat-guardrails/references/tool-definitions.md`.

### 7. Route handler tipis

`/api/tools/<nama>` hanya: rate limit → `parse` → panggil fungsi murni →
kembalikan JSON. Tidak ada logika engineering di route.

## Aturan penyajian hasil

Berlaku di chat maupun di UI kalkulator:

- Output **selalu** membawa label standar + edisi (`"ASTM A123/A123M (A123/A123M-24)"`).
  Angka tanpa label standar adalah angka yang bisa disalahpahami.
- Estimasi umur layanan **selalu rentang**, tidak pernah angka tunggal.
- Angka hasil tool diberi badge "dihitung oleh tool" di UI, dibedakan dari
  narasi LLM.
- Bila config belum terverifikasi, tampilkan peringatan — jangan sajikan
  angka belum terverifikasi sebagai fakta.
- Mode "bandingkan standar" memanggil tool beberapa kali dengan input sama dan
  menampilkan hasil **berdampingan dengan label**, tidak pernah digabung ke
  satu tabel tanpa label.

## Referensi

- **`references/existing-tools.md`** — inventaris tool v1 beserta kontrak
  input/output: coating thickness multi-standar, compare, durability,
  reactivity, units.
- **`references/test-patterns.md`** — pola unit test lengkap yang bisa disalin,
  termasuk seluruh boundary test.
- **`references/phase-2-tools.md`** — spesifikasi awal vent/drain advisor,
  zinc pickup estimator, kettle fit checker, defect photo triage.

## Aset

`assets/tool-template/` — kerangka `schema.ts`, `index.ts`, dan `example.test.ts`
siap salin ke `lib/tools/<nama-tool>/`.
