from galva_ingest.robots import RobotsGate

FAKE_ROBOTS_TXT = """
User-agent: *
Disallow: /members/
Disallow: /cache/
"""


def test_allows_permitted_path_on_allowed_host():
    gate = RobotsGate(fetch_text=lambda _url: FAKE_ROBOTS_TXT)
    allowed, reason = gate.can_fetch("https://galvanizeit.org/knowledgebase/article/x")
    assert allowed is True
    assert reason == "ok"


def test_blocks_disallowed_path_on_allowed_host():
    gate = RobotsGate(fetch_text=lambda _url: FAKE_ROBOTS_TXT)
    allowed, reason = gate.can_fetch("https://galvanizeit.org/members/secret")
    assert allowed is False
    assert "robots.txt" in reason


def test_blocks_host_outside_allowlist_even_if_robots_allows_all():
    gate = RobotsGate(fetch_text=lambda _url: "User-agent: *\nAllow: /")
    allowed, reason = gate.can_fetch("https://gaa.com.au/some/page")
    assert allowed is False
    assert "scraper" in reason or "anti-scraping" in reason


def test_unknown_host_outside_allowlist_is_blocked_with_generic_reason():
    gate = RobotsGate(fetch_text=lambda _url: "User-agent: *\nAllow: /")
    allowed, reason = gate.can_fetch("https://example.com/page")
    assert allowed is False
    assert "ALLOWED_HOSTS" in reason


def test_robots_txt_fetched_once_per_host_then_cached():
    calls: list[str] = []

    def fake_fetch(url: str) -> str:
        calls.append(url)
        return FAKE_ROBOTS_TXT

    gate = RobotsGate(fetch_text=fake_fetch)
    gate.can_fetch("https://galvanizeit.org/a")
    gate.can_fetch("https://galvanizeit.org/b")
    assert len(calls) == 1
