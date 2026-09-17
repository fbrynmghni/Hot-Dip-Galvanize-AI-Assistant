"""Polite HTTP fetcher: user-agent teridentifikasi + kontak, rate limit
antar-request, dan cek robots.txt sebelum tiap request -- lihat
hdg-rag-ingest/SKILL.md "Crawl yang sopan".
"""

from __future__ import annotations

import logging
import os
import time

import httpx

from .robots import USER_AGENT, RobotsGate

MIN_DELAY_SECONDS = 2.5

logger = logging.getLogger(__name__)

# Sinyal login-wall pasca-fetch, defense-in-depth di atas robots.txt --
# legal.md aturan #9 mensyaratkan halaman member-only tidak diambil "dengan
# cara apa pun", dan robots.txt tidak menjamin itu (dia mengatur crawler,
# bukan access control). Heuristik, bukan jaminan sempurna.
_LOGIN_WALL_URL_MARKERS = ("/login", "/members/", "/account/", "/sign-in")
_LOGIN_WALL_HTML_MARKERS = ('type="password"', "type='password'")


class LoginWallDetected(RuntimeError):
    """Halaman tampak berada di balik login meski robots.txt mengizinkannya."""


class MissingCrawlerContactError(RuntimeError):
    """CRAWLER_CONTACT_EMAIL wajib diisi sebelum crawl sungguhan dijalankan --
    asosiasi berhak tahu siapa yang mengambil kontennya (lihat
    hdg-rag-ingest/legal.md, dan komentar CRAWLER_CONTACT_EMAIL di .env.example).
    Sengaja TIDAK di-default ke alamat apa pun -- termasuk email pribadi
    pengguna -- supaya nilainya harus dipilih secara sadar sebelum menyentuh
    server pihak ketiga.
    """


class PoliteFetcher:
    def __init__(
        self,
        contact_email: str | None = None,
        min_delay_seconds: float = MIN_DELAY_SECONDS,
        robots_gate: RobotsGate | None = None,
        client: httpx.Client | None = None,
    ) -> None:
        self._contact_email = contact_email or os.environ.get("CRAWLER_CONTACT_EMAIL")
        if not self._contact_email:
            raise MissingCrawlerContactError(
                "CRAWLER_CONTACT_EMAIL kosong. Set di .env sebelum menjalankan crawl "
                "sungguhan -- lihat catatan di .env.example."
            )
        self._min_delay = min_delay_seconds
        self._robots = robots_gate or RobotsGate()
        self._client = client or httpx.Client(timeout=30, follow_redirects=True)
        self._last_request_at: float | None = None

    @property
    def user_agent(self) -> str:
        return f"{USER_AGENT} (contact: {self._contact_email})"

    def _throttle(self) -> None:
        if self._last_request_at is None:
            return
        elapsed = time.monotonic() - self._last_request_at
        remaining = self._min_delay - elapsed
        if remaining > 0:
            time.sleep(remaining)

    def fetch(self, url: str) -> str | None:
        """Return HTML on success, None if robots.txt disallows the URL.
        Raises on HTTP-level failure (4xx/5xx), or LoginWallDetected if the
        response looks like a login page -- caller decides what to skip.
        """
        allowed, reason = self._robots.can_fetch(url)
        if not allowed:
            logger.warning("Skip %s: %s", url, reason)
            return None

        self._throttle()
        response = self._client.get(url, headers={"User-Agent": self.user_agent})
        self._last_request_at = time.monotonic()
        response.raise_for_status()

        final_url = str(getattr(response, "url", url)).lower()
        html = response.text
        if any(marker in final_url for marker in _LOGIN_WALL_URL_MARKERS) or any(
            marker in html.lower() for marker in _LOGIN_WALL_HTML_MARKERS
        ):
            raise LoginWallDetected(f"{url} tampak berada di balik login (final url: {final_url}).")

        return html

    def close(self) -> None:
        self._client.close()
