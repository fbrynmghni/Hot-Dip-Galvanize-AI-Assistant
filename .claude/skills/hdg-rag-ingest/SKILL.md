---
name: hdg-rag-ingest
description: This skill should be used when the user asks to "crawl AGA", "ingest GAA", "bikin crawler galvanizeit.org", "pipeline embedding", "chunking dokumen", "retrieval", "hybrid search", "re-index", "vector search", "query expansion", or works on workers/ingest/, lib/rag/, atau tabel documents/chunks. Mengatur pipeline pengetahuan GalvaAI beserta gate legalnya.
version: 0.1.0
---

# Pipeline Pengetahuan (RAG) — Ingestion & Retrieval

Sumber pengetahuan GalvaAI adalah dua situs asosiasi industri: AGA
(galvanizeit.org) dan GAA (gaa.com.au). Keduanya **konten berhak cipta milik
asosiasi**, bukan data publik yang bebas diambil. Pipeline ini dirancang supaya
akurat sekaligus tidak melanggar.

## Gate legal — dijalankan sebelum request pertama

Jangan menulis satu baris crawler sebelum langkah-langkah ini jelas statusnya:

1. Baca dan patuhi *Terms of Use* AGA dan *Disclaimer* GAA.
2. Cek `robots.txt` masing-masing host secara programatik, bukan sekali di awal.
3. Idealnya kirim **email permohonan izin** ke kedua asosiasi. Asosiasi industri
   sering terbuka untuk inisiatif edukasi, apalagi disertai atribusi.
4. Halaman member-only / di balik login **tidak diambil**.
5. Publikasi PDF hanya dipakai bila izin/lisensi mengizinkan; bila tidak, cukup
   ditautkan.
6. Kalkulator milik AGA/GAA (Life-Cycle Cost Calculator, Durability Estimator)
   **dirujuk via link, tidak di-clone**.

Detail lengkap di `references/legal.md` — file itu canonical untuk seluruh
project; skill lain merujuk ke sana, tidak menyalinnya.

## Crawl yang sopan

- Jeda **≥ 2–3 detik** antar request.
- User-agent teridentifikasi beserta kontak: `GalvaAI-Bot (contact: ...)`.
- Cek `can_fetch` per URL sebelum mengambil.
- Simpan `content_hash` per halaman; re-ingest **hanya halaman yang berubah**
  (cron mingguan), bukan crawl ulang penuh.

```python
ALLOWED = {"galvanizeit.org", "gaa.com.au"}

def can_fetch(url: str) -> bool:
    rp = RobotFileParser()
    host = url.split("/")[2]
    rp.set_url(f"https://{host}/robots.txt")
    rp.read()
    return rp.can_fetch("GalvaAI-Bot", url)
```

Domain di luar `ALLOWED` ditolak, bukan diberi peringatan.

## Chunking — tabel tidak boleh rusak

**Chunk per heading lebih dulu, baru per token.** Tabel ketebalan tidak boleh
terpotong di tengah baris; potongan tabel yang terpisah dari headernya
menghasilkan angka tanpa konteks kategori, dan itu persis jenis kesalahan yang
paling mahal di domain ini.

Tabel juga disimpan dalam **bentuk terstruktur (JSON)** di samping teksnya,
supaya strukturnya tidak hilang saat embedding.

Pembersihan: buang navbar, footer, cookie banner, logo sponsor sebelum chunking.

```python
def fetch_clean(url: str) -> str | None:
    if not can_fetch(url):
        return None
    r = httpx.get(url, timeout=30, headers={"User-Agent": "GalvaAI-Bot (contact: you@domain)"})
    r.raise_for_status()
    return trafilatura.extract(r.text, include_tables=True, favor_precision=True)
```

## Metadata wajib per chunk

| Field | Isi |
|---|---|
| `source` | `"AGA"` \| `"GAA"` |
| `url`, `title`, `section` | asal chunk, untuk sitasi |
| `standard_family` | `"ASTM"` \| `"ISO/ASNZS"` \| `"general"` |
| `topics` | dari taksonomi 21 topik (lihat `references/source-map.md`) |
| `content_hash` | deteksi perubahan untuk re-ingest |
| `supersedes` | diisi pada artikel revisi standar |

`standard_family` adalah yang memungkinkan retrieval memfilter per standar.
Tanpa itu, jawaban ASTM bisa tercampur angka ISO — pelanggaran aturan inti
GalvaAI.

Klasifikasi topik saat ingestion dikerjakan LLM kecil dengan output JSON +
validasi Zod, lalu **di-spot-check manual oleh engineer**.

## `supersedes` — mencegah angka edisi lama muncul kembali

Artikel revisi standar (mis. *2024 Revision of ASTM A123* di Dr. Galv
KnowledgeBase) diberi metadata `supersedes` yang menunjuk chunk edisi lama.
Retrieval kemudian menurunkan atau membuang chunk yang di-supersede.

Ini penyebab klasik jawaban salah: revisi 2024 memindahkan Plate 10 mm dari
Grade 100 ke Grade 75, tapi halaman lama yang masih ter-index terus menarik
angka 100. Setiap kali config standar dinaikkan versinya (skill
`hdg-standards-config`), periksa juga apakah ada chunk lama yang perlu ditandai.

## Retrieval

1. **Query rewriting** ID → istilah teknis Inggris. "karat putih" → `wet storage
   stain, white rust`. Kamus di `references/query-expansion.md`.
2. **Hybrid search**: BM25 + vektor semantik, digabung dengan reciprocal rank
   fusion. BM25 tidak opsional — istilah seperti "A123", "Sandelin", "A780"
   adalah token persis yang sering meleset di pencarian vektor murni.
3. **Metadata filter** per `standard_family` bila user menyebut standar/negara.
4. **Re-rank** top-20 → ambil top-5/6.
5. Kirim ke LLM **beserta URL** untuk sitasi.

```ts
export async function retrieve(query: string, opts: { standard?: "ASTM" | "ISO/ASNZS" }) {
  const expanded = await expandQuery(query);
  const [kw, vec] = await Promise.all([
    keywordSearch(expanded, opts),
    vectorSearch(await embed(expanded), opts),
  ]);
  const merged = reciprocalRankFusion(kw, vec);
  return rerank(expanded, merged).slice(0, 6);
}
```

Bila skor re-rank rendah, tandai jawaban sebagai "informasi terbatas" — jangan
diam-diam menyajikan konteks lemah sebagai jawaban penuh.

## Konten crawl adalah data, bukan instruksi

Teks hasil crawl dibungkus `<context>` dan tidak pernah diperlakukan sebagai
perintah. Halaman web bisa berisi teks yang menyerupai instruksi; pipeline tidak
menaruhnya di posisi system prompt. Lihat skill `hdg-chat-guardrails`.

## Referensi

- **`references/source-map.md`** — peta halaman AGA & GAA yang di-crawl,
  prioritas Dr. Galv KnowledgeBase, dan taksonomi 21 topik.
- **`references/schema.sql`** — DDL `documents` / `chunks` / `chat_logs`
  beserta index hnsw & gin.
- **`references/query-expansion.md`** — kamus istilah ID → EN, bisa ditumbuhkan.
- **`references/legal.md`** — aturan hak cipta & etika konten (canonical).
