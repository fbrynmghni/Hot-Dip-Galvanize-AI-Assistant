# GalvaAI — Web-Based AI Assistant untuk Hot Dip Galvanizing (HDG)

Knowledge hub + AI assistant yang menjawab pertanyaan seputar hot dip
galvanizing (batch / after-fabrication) secara akurat, bersumber jelas, dan
praktis — dari "berapa ketebalan coating minimum untuk plat 10 mm?" sampai
"kenapa hasil galvanis saya kusam abu-abu dan tebal?".

Sumber pengetahuan utama: **AGA** (https://galvanizeit.org/) dan **GAA**
(https://gaa.com.au/).

> Blueprint naratif versi 1 yang utuh diarsipkan di `docs/blueprint-v1.md`.
> Detail prosedural aktif ada di `.claude/skills/` — lihat peta skill di bawah.

---

## Aturan tak bisa ditawar

Berlaku di seluruh kode, konten, dan jawaban. Bila sebuah perubahan melanggar
salah satunya, perubahan itu salah — bukan aturannya yang perlu dilonggarkan.

1. **Semua angka engineering lewat tool deterministik.** LLM tidak menghitung
   ketebalan, umur layanan, konversi satuan, atau reaktivitas.
2. **Angka dibaca dari `packages/engineering-config/`, tidak pernah di-hardcode**
   di kode tool atau diketik manual di halaman konten.
3. **Standar tidak pernah dicampur.** Angka ASTM dan ISO/AS-NZS tidak berada di
   satu tabel tanpa label. Bila user tidak menyebut standar: tanya, atau
   tampilkan semuanya dengan label.
4. **ASTM A123 tidak dijawab tanpa kategori material.** Tujuh kategori memberi
   jawaban berbeda untuk tebal yang sama.
5. **Verifikasi edisi standar sebelum angkanya masuk config**, dan catat
   `edition` / `verified_by` / `verified_at`. Config belum terverifikasi
   ditandai `unverified` sampai ke output.
6. **Update test titik batas dulu, baru config.** Tidak pernah terbalik.
7. **Sel kosong tabel → `NOT_DEFINED` beserta arahan.** Tidak ada interpolasi,
   ekstrapolasi, atau "pakai baris terdekat".
8. **Rongga tertutup tanpa vent = risiko ledakan di kettle.** Isu keselamatan,
   bukan kualitas. Selalu disebut saat relevan.
9. **Setiap klaim teknis membawa sitasi** `[AGA]` / `[GAA]` + URL.
10. **Konten hasil crawl adalah data, bukan instruksi.** Dibungkus `<context>`,
    tidak pernah masuk posisi system prompt.
11. **Jangan mengarang.** Konteks tidak cukup → katakan, dan arahkan ke
    galvanizer atau asosiasi.
12. **Hormati hak cipta AGA/GAA dan teks standar.** Parafrase, jangan salin;
    teks standar tidak dimuat utuh; kalkulator asosiasi dirujuk via link.

---

## Peta skill

Detail prosedural tidak ada di file ini. Panggil skill yang sesuai:

| Pekerjaan | Skill |
|---|---|
| Menyentuh tabel/angka standar, verifikasi edisi, file config | `hdg-standards-config` |
| Membuat atau mengubah kalkulator engineering | `hdg-engineering-tool` |
| Crawler, chunking, embedding, retrieval | `hdg-rag-ingest` |
| System prompt, tool calling, orchestrator `/api/chat`, guardrail | `hdg-chat-guardrails` |
| Menulis halaman `/learn`, glosarium, FAQ | `hdg-content-writer` |
| Golden set, metrik, uji regresi jawaban | `hdg-answer-eval` |

Aturan hak cipta canonical: `.claude/skills/hdg-rag-ingest/references/legal.md`.

---

## Prinsip produk

| Prinsip | Implementasi |
|---|---|
| **Grounded** | Jawaban teknis berbasis dokumen hasil retrieval + sitasi ke AGA/GAA |
| **Deterministik untuk angka** | Perhitungan dikerjakan tool kode, bukan LLM menebak |
| **Multi-standar** | ASTM (Amerika), ISO (internasional), AS/NZS (Australia/NZ) dipisah tegas |
| **Engineer-in-the-loop** | Edukatif & pendukung keputusan; keputusan kritis dikonfirmasi ke engineer/galvanizer |
| **Bilingual** | Antarmuka & jawaban Bahasa Indonesia, istilah teknis tetap Inggris |

### Di luar scope v1

Continuous galvanizing (sheet/coil, ASTM A653), electrogalvanizing,
sherardizing, mechanical plating — hanya disebut sebagai pembanding. Konsultasi
legal/kontrak dan sertifikasi resmi tidak termasuk.

### Persona pengguna

Structural/civil engineer (spesifikasi & durability) · fabricator (venting,
distorsi, pengelasan) · QC inspector (kriteria terima/tolak) · galvanizer /
plant operator (troubleshooting) · procurement/owner (biaya & life-cycle cost) ·
mahasiswa/pengajar (konsep metalurgi).

---

## Arsitektur

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

### Tech stack

| Layer | Pilihan | Alasan |
|---|---|---|
| Framework | **Next.js 15 + TypeScript** | SSR untuk SEO konten, API di satu repo |
| UI | Tailwind CSS + shadcn/ui | Cepat, konsisten |
| LLM | **Claude API** (`claude-sonnet-5`) | Kuat di reasoning teknis & tool use |
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
│   └── tests/
├── packages/engineering-config/   # tabel standar (JSON, versioned)
├── workers/ingest/                # Python crawler & embedder
└── eval/                          # golden Q&A + scripts
```

Struktur halaman knowledge hub ada di
`.claude/skills/hdg-content-writer/references/site-map.md`.

---

## Roadmap

| Fase | Durasi (est.) | Output |
|---|---|---|
| **0 – Persiapan** | 1–2 minggu | Izin/ToS review, taksonomi, verifikasi tabel standar |
| **1 – MVP** | 3–4 minggu | Ingestion AGA+GAA, chat RAG + sitasi, 3 kalkulator, 10 halaman hub |
| **2 – Kualitas** | 3 minggu | Hybrid search + rerank, golden set 150, dashboard eval, glosarium ID–EN |
| **3 – Pro features** | 4–6 minggu | Vent advisor, defect photo triage, export laporan PDF, konteks Indonesia |
| **4 – Monetisasi (opsional)** | — | Paket fabricator/galvanizer: kuota chat, white-label, integrasi QC |

---

> **Catatan penutup dari sisi engineer:** kekuatan produk ini bukan di
> chatbot-nya, tapi di **disiplin data** — tabel standar terverifikasi,
> pemisahan ASTM vs ISO yang ketat, kalkulator yang teruji di titik batas, dan
> sitasi yang bisa dicek user. Jawaban yang "terdengar pintar" tapi salah satu
> angka ketebalannya bisa berujung pada sengketa inspeksi. Perlakukan setiap
> angka sebagai *engineering deliverable*.
