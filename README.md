# GalvaAI — AI Assistant untuk Hot Dip Galvanizing

Knowledge hub dan AI assistant yang menjawab pertanyaan seputar **hot dip
galvanizing** (batch / after-fabrication) secara akurat, bersumber jelas, dan
praktis — dari _"berapa ketebalan coating minimum untuk plat 10 mm?"_ sampai
_"kenapa hasil galvanis saya kusam abu-abu dan tebal?"_

Dibangun dari sudut pandang metallurgical engineer yang bekerja di plant HDG,
dipadukan dengan arsitektur RAG + LLM + tool calling.

---

## Kenapa bukan sekadar chatbot

Di domain ini, jawaban yang *terdengar* benar tapi salah satu angka
ketebalannya bisa berujung pada sengketa inspeksi: produk yang sebenarnya lolos
ditolak, atau produk yang gagal justru diterima.

Karena itu arsitekturnya dibangun di atas beberapa aturan yang tidak bisa
ditawar:

| Aturan | Konsekuensi teknis |
|---|---|
| **LLM tidak menghitung angka engineering** | Ketebalan, umur layanan, konversi satuan, dan reaktivitas dikerjakan fungsi murni yang teruji, bukan ditebak model |
| **Angka berasal dari config terversi** | Tidak ada angka standar yang di-hardcode di kode atau diketik manual di halaman konten |
| **Standar tidak pernah dicampur** | Angka ASTM dan ISO/AS-NZS tidak berada di satu tabel tanpa label |
| **Verifikasi sebelum config, test sebelum kode** | Setiap angka dicek ke dokumen standar asli; titik batas punya unit test lebih dulu |
| **Sel kosong bukan izin menebak** | Kombinasi yang tidak dicakup tabel dikembalikan sebagai `NOT_DEFINED` beserta arahan |
| **Keselamatan disebut saat relevan** | Rongga tertutup tanpa vent dapat meledak di kettle — ini isu safety, bukan kualitas |
| **Setiap klaim teknis bersitasi** | Link ke sumber AGA/GAA yang bisa dicek pembaca |

Contoh kenapa ini penting: baja 10 mm dengan rata-rata terukur 90 µm **lolos**
ISO 1461 (≥ 85), **lolos** ASTM A123-24 sebagai _plate_ (Grade 75), tapi
**tidak lolos** sebagai _rolled beam_ (Grade 100). Satu produk, tiga jawaban
berbeda — tergantung standar dan kategori materialnya.

---

## Status

**Fase 0 — Persiapan**, hampir selesai. Blueprint dan disiplin engineering
sudah terkunci sebagai skill; aplikasinya belum di-scaffold.

| # | Item | Status | Catatan |
|---|---|---|---|
| 0.1 | Blueprint teknis & produk | ✅ Selesai | `docs/blueprint-v1.md` |
| 0.2 | Skill engineering (6 skill + referensi + template) | ✅ Selesai | `.claude/skills/` |
| 0.3 | Config standar awal (draft) | ✅ Selesai | ASTM A123, ISO 1461, AS/NZS 4680, ISO 9223 |
| 0.4 | Sitasi sumber terbuka (bukan teks standar berbayar) | ✅ Selesai | AGA/GAA/UK Galvanizers Association, lihat `references/iso-asnzs.md` |
| 0.5 | Verifikasi resmi (`verified_by`/`verified_at`) | ⬜ Belum | Butuh sign-off engineer yang pegang salinan sah, **atau** proyek berjalan permanen dengan status `unverified` |
| 0.6 | Ambiguitas batas 1,5 mm ISO 1461 | ⬜ Belum | 2 sumber terbuka berbeda arah; sudah di-flag sebagai unconfirmed test case |
| 0.7 | Review Terms of Use AGA & Disclaimer GAA | 🟡 Sebagian | Sudah dibaca — lihat ringkasan di bawah. Email permohonan izin **belum dikirim** |
| 0.8 | Scaffold aplikasi Next.js | ✅ Selesai | `apps/web` (Next.js 15 + TS + Tailwind), `packages/engineering-config`, `workers/ingest`, `eval` — lihat "Struktur repo" |

> ⚠️ **Angka standar di repo ini belum diverifikasi.** Semua config ditandai
> `"unverified": true` dan `verified_by: null`. Selama flag itu ada, output tool
> wajib membawanya sampai ke jawaban. Jangan dipakai sebagai dasar keputusan
> inspeksi sebelum diverifikasi ke edisi standar yang dimiliki secara sah.

### Fase 1 — MVP

| # | Item | Status |
|---|---|---|
| 1.1 | Ingestion AGA (crawl → clean → chunk → embed) | 🟡 Pipeline selesai, belum dijalankan sungguhan | `workers/ingest/`, 36 test lulus. GAA ditunda (robots.txt anti-scraping). Storage masih JSON lokal, belum Postgres/pgvector. Butuh `CRAWLER_CONTACT_EMAIL` sebelum crawl nyata |
| 1.2 | Chat RAG + tool calling + sitasi | ⬜ Belum |
| 1.3 | 3 kalkulator (thickness, durability, reactivity) | ✅ Logic + API selesai | `apps/web/lib/tools/`, `/api/tools/[name]`; 52 test lulus. UI form kalkulator (`/tools` masih halaman info) belum dibangun |
| 1.4 | 10 halaman knowledge hub | ⬜ Belum |

### Fase 2 — Kualitas

| # | Item | Status |
|---|---|---|
| 2.1 | Hybrid search + re-ranking | ⬜ Belum |
| 2.2 | Golden set 150 kasus | ⬜ Belum |
| 2.3 | Dashboard eval (faithfulness, citation accuracy) | ⬜ Belum |
| 2.4 | Glosarium ID–EN | ⬜ Belum |

### Fase 3 — Pro features

| # | Item | Status |
|---|---|---|
| 3.1 | Vent hole advisor | ⬜ Belum |
| 3.2 | Defect photo triage | ⬜ Belum |
| 3.3 | Export laporan PDF | ⬜ Belum |
| 3.4 | Konteks Indonesia (SNI, harga lokal) | ⬜ Belum |

### Fase 4 — dihapus

Proyek ini portofolio & edukasi, bukan produk komersial — **tidak ada rencana
monetisasi**. Fase "Monetisasi (opsional)" di roadmap versi awal sudah
dihapus dari cakupan.

### Ringkasan Terms of Use / Disclaimer (dibaca 2026-09-16, belum ada izin tertulis)

- **AGA** ([Terms of Use](https://galvanizeit.org/about-aga/terms-of-use)) —
  memegang hak cipta (`© 2026 AGA`); konten "general information only";
  mereferensikan dokumen terpisah "Copyright and Proprietary Information Use
  Policy" yang tidak ditemukan teksnya secara publik. Tidak ada klausul
  eksplisit soal crawling otomatis atau penggunaan oleh AI di teks yang
  terbaca. AGA sendiri secara eksplisit menyatakan tidak mendistribusikan
  ulang teks standar ASTM/ISO/AMPP berbayar — sejalan dengan aturan #12 di
  `CLAUDE.md`.
- **GAA** ([Disclaimer](https://gaa.com.au/disclaimer/)) — hanya berisi
  pembatasan tanggung jawab (liability), tidak ada klausul reuse/copyright
  eksplisit di halaman ini. Hak cipta default tetap berlaku meski tidak
  dinyatakan ulang.
- **Belum dilakukan:** mengirim email permohonan izin resmi ke AGA & GAA
  (lihat `hdg-rag-ingest/references/legal.md` §1). Ini keputusan yang perlu
  persetujuan pemilik proyek sebelum dikirim atas nama proyek/organisasi.

---

## Struktur repo

```
.
├── CLAUDE.md                      # Aturan aktif + arsitektur (dibaca tiap sesi)
├── docs/
│   └── blueprint-v1.md            # Blueprint naratif utuh (arsip)
├── .claude/skills/                # Disiplin engineering sebagai skill
│   ├── hdg-standards-config/      # Tabel standar & prosedur verifikasi
│   ├── hdg-engineering-tool/      # Resep kalkulator deterministik
│   ├── hdg-rag-ingest/            # Crawl, chunking, retrieval, legal
│   ├── hdg-chat-guardrails/       # System prompt, tool calling, guardrail
│   ├── hdg-content-writer/        # Konten knowledge hub
│   └── hdg-answer-eval/           # Golden set & metrik kualitas
├── apps/web/                      # Next.js 15 + TypeScript + Tailwind
│   ├── app/(hub)/learn/[slug]/    # halaman artikel
│   ├── app/chat/                  # UI chat
│   ├── app/tools/                 # kalkulator
│   ├── app/api/chat/route.ts
│   ├── app/api/tools/[name]/route.ts
│   └── tests/                     # vitest (belum ada test — lihat hdg-engineering-tool)
├── packages/engineering-config/   # tabel standar (JSON, versioned) — sumber angka
├── workers/ingest/                # crawler & embedder (belum diimplementasikan)
└── eval/                          # golden Q&A + skrip metrik (belum diimplementasikan)
```

Jalankan `npm install` di root, lalu `npm run dev` untuk apps/web (npm
workspaces, bukan pnpm/yarn).

Setelah scaffolding, akan bertambah:

```
├── apps/web/                      # Next.js 15 (App Router)
├── packages/engineering-config/   # Tabel standar (JSON, versioned)
├── workers/ingest/                # Crawler & embedder (Python)
└── eval/                          # Golden Q&A + scripts
```

---

## Skill

Repo ini menyimpan disiplin engineering-nya sebagai skill, bukan hanya sebagai
dokumen. Setiap skill memuat prosedur yang ter-trigger saat pekerjaan yang
relevan dimulai, plus `references/` yang dimuat sesuai kebutuhan.

| Skill | Dipanggil saat |
|---|---|
| `hdg-standards-config` | Menyentuh tabel/angka standar, verifikasi edisi, file config |
| `hdg-engineering-tool` | Membuat atau mengubah kalkulator engineering |
| `hdg-rag-ingest` | Crawler, chunking, embedding, retrieval |
| `hdg-chat-guardrails` | System prompt, tool calling, orchestrator, guardrail |
| `hdg-content-writer` | Menulis halaman `/learn`, glosarium, FAQ |
| `hdg-answer-eval` | Golden set, metrik, uji regresi jawaban |

Ketiganya saling terkait: perubahan tabel standar **wajib** menambah kasus di
golden set, dan perubahan aturan system prompt juga.

---

## Tech stack

| Layer | Pilihan |
|---|---|
| Framework | Next.js 15 + TypeScript |
| UI | Tailwind CSS + shadcn/ui |
| LLM | OpenAI API (`gpt-5.5`) |
| Embedding | OpenAI `text-embedding-3-large` |
| Vector DB | Supabase Postgres + pgvector |
| Re-ranking | Cohere Rerank / Voyage rerank |
| Ingestion | Python (httpx, trafilatura, pdfplumber) |
| Validasi | Zod (TS) / Pydantic (Py) |
| Deploy | Vercel + Supabase + cron worker |

---

## Standar yang didukung

| Standar | Konteks | Output |
|---|---|---|
| **ASTM A123/A123M-24** | Amerika Utara, banyak proyek EPC/oil & gas | Coating Grade per kategori material (7 kategori) + tebal terukur |
| **ISO 1461** | Internasional, Eropa, Asia | Local min & mean min (µm) per tebal baja |
| **AS/NZS 4680** | Australia & Selandia Baru | Local min & average min (µm) per tebal baja |
| **ISO 9223** | Klasifikasi korosivitas C1–CX | Laju korosi zinc untuk estimasi umur |

ISO 1461 dan AS/NZS 4680 disimpan sebagai **config terpisah** meski tabelnya
mirip — batas di 1,5 mm berbeda (ISO `≥ 1,5` → 45/55; AS/NZS `≤ 1,5` → 35/45).

Baut, mur, dan hardware yang di-centrifuge mengikuti **ASTM A153**, bukan A123.

---

## Sumber & atribusi

Pengetahuan domain bersumber dari dua asosiasi industri:

- **American Galvanizers Association (AGA)** — https://galvanizeit.org/
- **Galvanizers Association of Australia (GAA)** — https://gaa.com.au/

Project ini **tidak berafiliasi resmi** dengan AGA maupun GAA, dan tidak
menggunakan logo atau merek keduanya.

Konten hub ditulis ulang dengan bahasa sendiri dan selalu menyertakan tautan ke
sumbernya; halaman sumber tidak ditampilkan ulang secara utuh. Kalkulator milik
asosiasi (*Life-Cycle Cost Calculator*, *Durability of Galvanizing Estimator*)
dirujuk via link, tidak di-clone.

Teks standar ASTM/ISO/AS-NZS berhak cipta dan **tidak dimuat utuh** di repo ini —
yang disimpan hanya nilai numerik yang diperlukan tool, beserta rujukan nomor
tabel dan klausulnya.

Aturan lengkap: [`legal.md`](.claude/skills/hdg-rag-ingest/references/legal.md)

---

## Disclaimer

GalvaAI bersifat **edukatif dan pendukung keputusan**. Ini bukan pengganti
engineer atau inspector berwenang. Keputusan desain, spesifikasi, dan
penerimaan hasil galvanis tetap berada pada pihak yang berwenang, mengacu pada
edisi standar yang berlaku di proyek masing-masing.

---

## Lisensi

[MIT](LICENSE) — berlaku untuk kode dan konten asli repo ini. Tidak berlaku
untuk materi pihak ketiga yang dirujuk (AGA, GAA, dan badan standar).
