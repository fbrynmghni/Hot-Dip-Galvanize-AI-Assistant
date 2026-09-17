"""Model chunk & metadata wajib -- lihat SKILL.md "Metadata wajib per chunk"
dan references/source-map.md.
"""

from __future__ import annotations

import hashlib
from typing import Literal
from urllib.parse import urlparse

from pydantic import BaseModel

Source = Literal["AGA", "GAA"]
StandardFamily = Literal["ASTM", "ISO/ASNZS", "general"]

_HOST_TO_SOURCE: dict[str, Source] = {
    "galvanizeit.org": "AGA",
    "gaa.com.au": "GAA",
}


def source_from_url(url: str) -> Source:
    """Derive `source` from the URL's host -- never hardcode it at the call
    site. When GAA crawling is eventually enabled (robots.py ALLOWED_HOSTS),
    this is what stops GAA chunks from being silently stamped "AGA".
    """
    host = urlparse(url).netloc
    try:
        return _HOST_TO_SOURCE[host]
    except KeyError:
        raise ValueError(f"Tidak tahu cara memetakan host '{host}' ke Source (AGA/GAA).") from None

HDG_TOPICS = (
    "corrosion-basics",
    "process",
    "metallurgy",
    "steel-chemistry",
    "coating-thickness",
    "durability",
    "design-venting",
    "distortion",
    "welding",
    "embrittlement",
    "fasteners",
    "rebar",
    "inspection",
    "defects",
    "repair",
    "duplex-painting",
    "powder-coating",
    "storage-wet-storage-stain",
    "sustainability",
    "cost-lcc",
    "safety",
)


class Chunk(BaseModel):
    source: Source
    url: str
    title: str
    section: str
    standard_family: StandardFamily
    topics: list[str] = []
    text: str
    content_hash: str
    supersedes: str | None = None  # url atau content_hash chunk edisi lama


def content_hash(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def infer_standard_family(source: Source, text: str) -> StandardFamily:
    """Tebakan awal berdasarkan teks; fallback ke `source` hanya bila teks
    tidak menyebut standar mana pun. Chunk yang menyebut KEDUA keluarga
    (mis. tabel pembanding ASTM vs ISO) ditandai "general" -- jangan sampai
    dipakai sebagai sumber angka untuk satu standar saja.
    """
    t = text.upper()
    mentions_astm = "ASTM" in t
    mentions_iso = "AS/NZS" in t or "ISO 1461" in t or "ISO 9223" in t
    if mentions_astm and mentions_iso:
        return "general"
    if mentions_astm:
        return "ASTM"
    if mentions_iso:
        return "ISO/ASNZS"
    return "ASTM" if source == "AGA" else "ISO/ASNZS"
