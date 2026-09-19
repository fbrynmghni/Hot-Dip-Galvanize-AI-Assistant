"""Chunking: per heading dulu, baru per token -- tabel tidak boleh terpotong
di tengah baris (lihat SKILL.md "Chunking — tabel tidak boleh rusak").

Markdown tabel diperlakukan sebagai satu blok atomik: kalau sebuah heading
section berisi tabel, section itu tidak pernah dipecah lagi walau melebihi
`max_chars`, supaya baris tabel tidak pernah terpisah dari header kolomnya.

Catatan batasan: deteksi heading berbasis regex (baris yang diawali `#`) bisa
salah menganggap teks kutipan/contoh markdown yang kebetulan diawali `#`
sebagai heading sungguhan. Trafilatura tidak selalu mempertahankan format
blockquote/code-fence untuk membedakannya. Perbaikan penuh butuh parser
markdown AST (mis. markdown-it-py), bukan regex -- didokumentasikan sebagai
batasan yang diketahui, bukan diperbaiki dengan tambalan regex yang rapuh.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$", re.MULTILINE)
TABLE_ROW_RE = re.compile(r"^\s*\|.*\|\s*$", re.MULTILINE)


@dataclass
class Section:
    heading: str
    text: str
    has_table: bool = field(default=False)


def split_by_heading(markdown: str, default_heading: str = "") -> list[Section]:
    """Belah markdown jadi section per heading. Teks sebelum heading pertama
    (kalau ada) masuk ke section dengan `default_heading`.
    """
    matches = list(HEADING_RE.finditer(markdown))
    if not matches:
        return [Section(heading=default_heading, text=markdown.strip(), has_table=_has_table(markdown))]

    sections: list[Section] = []
    if matches[0].start() > 0:
        preamble = markdown[: matches[0].start()].strip()
        if preamble:
            sections.append(Section(heading=default_heading, text=preamble, has_table=_has_table(preamble)))

    for i, m in enumerate(matches):
        heading = m.group(2).strip()
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(markdown)
        body = markdown[start:end].strip()
        sections.append(Section(heading=heading, text=body, has_table=_has_table(body)))

    return sections


def _has_table(text: str) -> bool:
    # Sebuah tabel markdown sungguhan selalu punya >= 2 baris berpola "|...|"
    # (header + separator, minimal). Satu baris tunggal yang kebetulan diapit
    # "|" (mis. catatan dekoratif) bukan tabel -- jangan sampai itu membuat
    # seluruh section dikecualikan dari pemecahan per-paragraf.
    return len(TABLE_ROW_RE.findall(text)) >= 2


def _wrap_text(text: str, limit: int) -> list[str]:
    """Fallback untuk satu paragraf yang sendirian sudah melebihi `limit` --
    potong di batas kata (bukan di tengah kata), tidak pernah mengembalikan
    potongan lebih panjang dari `limit` kecuali satu kata tunggal memang
    lebih panjang dari `limit` itu sendiri.
    """
    words = text.split(" ")
    pieces: list[str] = []
    current = ""
    for w in words:
        candidate = f"{current} {w}".strip()
        if len(candidate) > limit and current:
            pieces.append(current)
            current = w
        else:
            current = candidate
    if current:
        pieces.append(current)
    return pieces


def chunk_section(section: Section, max_chars: int = 1500) -> list[str]:
    """Pecah satu section jadi potongan <= max_chars, kecuali section itu
    berisi tabel -- tabel selalu dikembalikan utuh sebagai satu chunk supaya
    baris tidak pernah terpisah dari header kolomnya, meski melebihi max_chars.
    """
    header = f"## {section.heading}\n\n" if section.heading else ""
    full_text = f"{header}{section.text}"
    if section.has_table or len(full_text) <= max_chars:
        return [full_text]

    paragraphs = [p for p in section.text.split("\n\n") if p.strip()]
    # Paragraf tunggal yang sendirian melebihi kapasitas (setelah header)
    # dipecah dulu di batas kata, supaya loop flush di bawah tidak pernah
    # menghasilkan satu chunk yang jauh melebihi max_chars.
    budget = max_chars - len(header)
    pieces = [p for para in paragraphs for p in (_wrap_text(para, budget) if len(para) > budget else [para])]

    chunks: list[str] = []
    current = header
    header_len = len(current)
    for p in pieces:
        if len(current) + len(p) + 2 > max_chars and len(current) > header_len:
            chunks.append(current.rstrip())
            current = header
        current += p + "\n\n"
    if current.strip():
        chunks.append(current.rstrip())
    return chunks or [full_text]


def chunk_markdown(markdown: str, max_chars: int = 1500) -> list[tuple[str, str]]:
    """Return list of (heading, chunk_text) pairs untuk seluruh dokumen."""
    result: list[tuple[str, str]] = []
    for section in split_by_heading(markdown):
        if not section.text.strip():
            continue
        for piece in chunk_section(section, max_chars=max_chars):
            result.append((section.heading, piece))
    return result
