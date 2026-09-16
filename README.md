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

**Fase 0 — Persiapan.** Blueprint dan disiplin engineering sudah terkunci
sebagai skill; aplikasinya belum di-scaffold.

- [x] Blueprint teknis & produk
- [x] Skill engineering (6 skill + referensi + template)
- [x] Config standar awal (ASTM A123, ISO 1461, AS/NZS 4680, ISO 9223) — **belum diverifikasi**
- [ ] Verifikasi tabel standar ke dokumen asli
- [ ] Review Terms of Use AGA/GAA & permohonan izin
- [ ] Scaffold aplikasi Next.js
- [ ] Kalkulator + unit test titik batas
- [ ] Pipeline ingestion & retrieval
- [ ] Chat orchestrator
- [ ] Deployment

> ⚠️ **Angka standar di repo ini belum diverifikasi.** Semua config ditandai
> `"unverified": true` dan `verified_by: null`. Selama flag itu ada, output tool
> wajib membawanya sampai ke jawaban. Jangan dipakai sebagai dasar keputusan
> inspeksi sebelum diverifikasi ke edisi standar yang dimiliki secara sah.

---

## Struktur repo

```
.
├── CLAUDE.md                 # Aturan aktif + arsitektur (dibaca tiap sesi)
├── docs/
│   └── blueprint-v1.md       # Blueprint naratif utuh (arsip)
└── .claude/skills/           # Disiplin engineering sebagai skill
    ├── hdg-standards-config/ # Tabel standar & prosedur verifikasi
    ├── hdg-engineering-tool/ # Resep kalkulator deterministik
    ├── hdg-rag-ingest/       # Crawl, chunking, retrieval, legal
    ├── hdg-chat-guardrails/  # System prompt, tool calling, guardrail
    ├── hdg-content-writer/   # Konten knowledge hub
    └── hdg-answer-eval/      # Golden set & metrik kualitas
```

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
