# Ingestion worker

Crawler + chunker + embedder untuk AGA (galvanizeit.org). Prosedur dan gate
legal ada di `.claude/skills/hdg-rag-ingest/` — baca `references/legal.md`
sebelum mengubah domain/scope crawl.

## Status

- **AGA (galvanizeit.org)** — diimplementasikan, robots.txt bersih untuk
  crawling umum.
- **GAA (gaa.com.au)** — **belum di-crawl.** robots.txt GAA memblokir
  puluhan named scraper/downloader bot dengan `Disallow: /`; `GalvaAI-Bot`
  tidak disebut namanya jadi secara teknis tidak dilarang, tapi itu sinyal
  anti-scraping eksplisit. Ditunda sampai ada keputusan/izin lain — lihat
  `src/galva_ingest/robots.py` (`ALLOWED_HOSTS`, `BLOCKED_HOSTS_REASON`).
- **Storage** — hasil (chunk + embedding) disimpan sebagai file JSON di
  `.cache/` (gitignored). **Belum tersambung ke Supabase/Postgres+pgvector**
  (`references/schema.sql` di skill sudah siap begitu ada instance).
- **Topik (21-topic taxonomy)** — belum diklasifikasi; setiap chunk
  disimpan dengan `topics: []`. SKILL.md mensyaratkan klasifikasi LLM +
  spot-check manual, sengaja belum dijalankan di pass pertama ini.
- **`supersedes`** — belum diisi untuk chunk mana pun, termasuk artikel
  revisi ASTM A123 2024. Butuh penyimpanan persisten untuk mencari chunk
  edisi lama sebelum bisa ditandai secara aman.

## Setup

```sh
cd workers/ingest
python3 -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
```

## Test

```sh
pytest -q
```

Semua test jalan tanpa network — robots.txt, HTTP fetch, dan embedding
di-inject sebagai fake/stub. Tidak butuh `CRAWLER_CONTACT_EMAIL` atau
`OPENAI_API_KEY` untuk `pytest`.

## Menjalankan crawl sungguhan

Wajib set `CRAWLER_CONTACT_EMAIL` di `.env` root repo dulu (asosiasi berhak
tahu siapa yang mengambil kontennya) — pipeline menolak jalan tanpanya:

```sh
# dari workers/ingest/, dengan .venv aktif
set -a && source ../../.env && set +a
python -m galva_ingest.pipeline            # crawl + embed (OPENAI_API_KEY wajib)
python -m galva_ingest.pipeline --no-embed # crawl + chunk saja, skip OpenAI
```

Rate limit ≥2,5 detik antar request, user-agent teridentifikasi
(`GalvaAI-Bot (contact: ...)`), robots.txt dicek per URL, dan halaman yang
sudah tersimpan dengan konten identik (content hash sama) di-skip supaya
tidak re-embed / re-fetch mahal secara sia-sia di run berikutnya.

Daftar URL awal ada di `src/galva_ingest/seeds.py` — sengaja kecil (6 URL
terverifikasi manual) untuk membuktikan pipeline bekerja sebelum diperluas
lewat sitemap AGA.
