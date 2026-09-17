"""Robots.txt gate. Dicek per-host, bukan sekali di awal proses -- lihat
hdg-rag-ingest/SKILL.md "Gate legal" langkah 2.
"""

from __future__ import annotations

from typing import Callable
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser

USER_AGENT = "GalvaAI-Bot"

# Domain yang boleh di-crawl sama sekali. GAA sengaja TIDAK dimasukkan --
# robots.txt gaa.com.au berisi blocklist eksplisit puluhan nama tool
# scraper/downloader (Wget, HTTrack, dll) dengan `Disallow: /`. GalvaAI-Bot
# secara harfiah tidak disebut di daftar itu, tapi itu sinyal kuat asosiasi
# tidak ingin di-scraping otomatis -- ditunda sampai ada keputusan/izin lain.
# Lihat references/legal.md.
ALLOWED_HOSTS = {"galvanizeit.org"}

BLOCKED_HOSTS_REASON = {
    "gaa.com.au": (
        "robots.txt gaa.com.au memblokir puluhan named scraper/downloader bot "
        "(Wget, HTTrack, SiteSnagger, dst) dengan Disallow: / -- sinyal anti-scraping "
        "eksplisit. Ditunda sampai ada izin tertulis dari GAA."
    ),
}


class RobotsGate:
    """Cache satu RobotFileParser per host supaya robots.txt tidak di-fetch
    ulang di setiap request, tapi keputusan can_fetch tetap dievaluasi per URL.
    """

    def __init__(self, fetch_text: Callable[[str], str] | None = None) -> None:
        self._parsers: dict[str, RobotFileParser] = {}
        # `fetch_text` disuntikkan untuk testing -- default pakai RobotFileParser.read()
        # yang melakukan HTTP request sungguhan.
        self._fetch_text = fetch_text

    def _parser_for(self, host: str) -> RobotFileParser:
        if host not in self._parsers:
            rp = RobotFileParser()
            robots_url = f"https://{host}/robots.txt"
            rp.set_url(robots_url)
            if self._fetch_text is not None:
                rp.parse(self._fetch_text(robots_url).splitlines())
            else:
                rp.read()
            self._parsers[host] = rp
        return self._parsers[host]

    def can_fetch(self, url: str) -> tuple[bool, str]:
        """Return (allowed, reason). `reason` selalu diisi supaya caller bisa log
        kenapa sebuah URL ditolak -- jangan pernah menolak diam-diam.
        """
        host = urlparse(url).netloc
        if host not in ALLOWED_HOSTS:
            reason = BLOCKED_HOSTS_REASON.get(
                host, f"Host '{host}' tidak ada di ALLOWED_HOSTS."
            )
            return False, reason

        parser = self._parser_for(host)
        if not parser.can_fetch(USER_AGENT, url):
            return False, f"robots.txt {host} melarang {USER_AGENT} mengakses path ini."
        return True, "ok"
