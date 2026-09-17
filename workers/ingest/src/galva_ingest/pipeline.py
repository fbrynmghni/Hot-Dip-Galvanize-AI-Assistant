"""Orkestrasi crawl -> clean -> chunk -> embed. Hasil disimpan sebagai file
JSON lokal di .cache/ (belum tersambung ke Postgres/pgvector -- lihat
`workers/ingest/README.md`).

Topik (21-topic taxonomy) belum diklasifikasi di sini -- SKILL.md
mensyaratkan klasifikasi LLM + spot-check manual, yang sengaja belum
dijalankan di pass pertama ini. Chunk disimpan dengan `topics: []`.

`supersedes` juga sengaja dibiarkan None untuk semua chunk saat ini,
termasuk artikel revisi ASTM A123 2024 -- pipeline ini belum bisa
mendeteksi/menghubungkan ke chunk edisi lama karena belum ada penyimpanan
persisten untuk dicari (lihat SKILL.md "supersedes — mencegah angka edisi
lama muncul kembali"). Begitu ada DB, tambahkan langkah pencarian eksplisit
sebelum menandai supersedes -- jangan menebak.
"""

from __future__ import annotations

import argparse
import json
import logging
from pathlib import Path

from .chunk import chunk_markdown
from .clean import extract_markdown, extract_title
from .embed import Embedder
from .fetch import PoliteFetcher
from .metadata import Chunk, content_hash, infer_standard_family, source_from_url
from .seeds import AGA_SEED_URLS

logger = logging.getLogger(__name__)

DEFAULT_CACHE_DIR = Path(__file__).resolve().parents[2] / ".cache"


def ingest_url(url: str, fetcher: PoliteFetcher) -> list[Chunk]:
    source = source_from_url(url)  # raises early on an unmapped host -- fail loud, not silent
    html = fetcher.fetch(url)
    if html is None:
        return []

    markdown = extract_markdown(html)
    if not markdown:
        logger.warning("Tidak ada konten utama terdeteksi di %s (trafilatura kosong)", url)
        return []

    title = extract_title(html) or url

    chunks: list[Chunk] = []
    for heading, text in chunk_markdown(markdown):
        chunks.append(
            Chunk(
                source=source,
                url=url,
                title=title,
                section=heading or title,
                standard_family=infer_standard_family(source, text),
                topics=[],
                text=text,
                content_hash=content_hash(text),
            )
        )
    return chunks


def _cache_key(url: str, chunk_content_hash: str) -> str:
    # content_hash alone collides when two different pages share byte-identical
    # text (e.g. an identical boilerplate note); folding the URL in keeps each
    # page's chunks distinct without losing the ability to detect "this exact
    # chunk already exists" per URL (used for the unchanged-content skip below).
    url_tag = content_hash(url)[:12]
    return f"{url_tag}-{chunk_content_hash}"


def run(
    urls: tuple[str, ...] = AGA_SEED_URLS,
    cache_dir: Path = DEFAULT_CACHE_DIR,
    embed: bool = True,
    contact_email: str | None = None,
    fetcher: PoliteFetcher | None = None,
    embedder: Embedder | None = None,
) -> list[Chunk]:
    cache_dir.mkdir(parents=True, exist_ok=True)
    fetcher = fetcher or PoliteFetcher(contact_email=contact_email)
    if embedder is None:
        embedder = Embedder() if embed else None

    all_chunks: list[Chunk] = []
    failed_urls: list[str] = []
    try:
        for url in urls:
            logger.info("Fetching %s", url)
            try:
                page_chunks = ingest_url(url, fetcher)
            except Exception:
                # Satu URL gagal (rename, 404, timeout, dst.) tidak boleh
                # menggagalkan seluruh batch -- lanjut ke URL berikutnya.
                logger.exception("Gagal ingest %s, lanjut ke URL berikutnya", url)
                failed_urls.append(url)
                continue

            if not page_chunks:
                continue

            new_chunks = [
                c
                for c in page_chunks
                if not (cache_dir / f"{_cache_key(c.url, c.content_hash)}.json").exists()
            ]
            skipped = len(page_chunks) - len(new_chunks)
            if skipped:
                logger.info("%s: %d chunk tidak berubah, skip re-embed", url, skipped)

            if new_chunks and embedder is not None:
                vectors = embedder.embed([c.text for c in new_chunks])
                for chunk, vector in zip(new_chunks, vectors):
                    out = {**chunk.model_dump(), "embedding": vector}
                    _write_chunk(cache_dir, _cache_key(chunk.url, chunk.content_hash), out)
            elif new_chunks:
                for chunk in new_chunks:
                    _write_chunk(cache_dir, _cache_key(chunk.url, chunk.content_hash), chunk.model_dump())

            all_chunks.extend(page_chunks)
    finally:
        fetcher.close()

    logger.info(
        "Selesai: %d chunk dari %d/%d URL berhasil, disimpan di %s",
        len(all_chunks),
        len(urls) - len(failed_urls),
        len(urls),
        cache_dir,
    )
    if failed_urls:
        logger.warning("URL gagal: %s", failed_urls)
    return all_chunks


def _write_chunk(cache_dir: Path, cache_key: str, payload: dict) -> None:
    path = cache_dir / f"{cache_key}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(message)s")
    parser = argparse.ArgumentParser(description="GalvaAI ingestion pipeline (AGA only)")
    parser.add_argument(
        "--no-embed", action="store_true", help="Skip pemanggilan OpenAI embeddings API"
    )
    parser.add_argument("--cache-dir", type=Path, default=DEFAULT_CACHE_DIR)
    args = parser.parse_args()
    run(cache_dir=args.cache_dir, embed=not args.no_embed)


if __name__ == "__main__":
    main()
