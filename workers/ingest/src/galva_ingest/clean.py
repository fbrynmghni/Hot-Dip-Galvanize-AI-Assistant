"""Ekstraksi konten bersih dari HTML mentah -- buang navbar/footer/cookie
banner, pertahankan struktur heading dan tabel (lihat SKILL.md "Chunking").
"""

from __future__ import annotations

import trafilatura


def extract_markdown(html: str) -> str | None:
    """Return markdown-ish text (headings + tables preserved) or None if
    trafilatura can't find a main-content block (e.g. listing/nav-only page).
    """
    return trafilatura.extract(
        html,
        include_tables=True,
        favor_precision=True,
        output_format="markdown",
    )


def extract_title(html: str) -> str | None:
    metadata = trafilatura.extract_metadata(html)
    return metadata.title if metadata else None
