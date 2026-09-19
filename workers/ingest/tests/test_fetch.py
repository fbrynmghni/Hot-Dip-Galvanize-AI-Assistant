import pytest

from galva_ingest.fetch import LoginWallDetected, MissingCrawlerContactError, PoliteFetcher
from galva_ingest.robots import RobotsGate


class _FakeResponse:
    def __init__(self, text: str = "<html></html>", url: str | None = None) -> None:
        self.text = text
        self.url = url

    def raise_for_status(self) -> None:
        pass


class _FakeClient:
    def __init__(self, response_text: str = "<html></html>", response_url: str | None = None) -> None:
        self.calls: list[dict] = []
        self._response_text = response_text
        self._response_url = response_url

    def get(self, url: str, headers: dict) -> _FakeResponse:
        self.calls.append({"url": url, "headers": headers})
        return _FakeResponse(text=self._response_text, url=self._response_url or url)

    def close(self) -> None:
        pass


def _allow_all_gate() -> RobotsGate:
    return RobotsGate(fetch_text=lambda _url: "User-agent: *\nAllow: /")


def test_raises_without_contact_email(monkeypatch):
    monkeypatch.delenv("CRAWLER_CONTACT_EMAIL", raising=False)
    with pytest.raises(MissingCrawlerContactError):
        PoliteFetcher(contact_email=None, robots_gate=_allow_all_gate(), client=_FakeClient())


def test_user_agent_includes_contact_email():
    fetcher = PoliteFetcher(
        contact_email="ingest@example.org", robots_gate=_allow_all_gate(), client=_FakeClient()
    )
    assert fetcher.user_agent == "GalvaAI-Bot (contact: ingest@example.org)"


def test_fetch_returns_none_when_robots_disallows():
    blocking_gate = RobotsGate(fetch_text=lambda _url: "User-agent: *\nDisallow: /")
    fake_client = _FakeClient()
    fetcher = PoliteFetcher(
        contact_email="ingest@example.org", robots_gate=blocking_gate, client=fake_client
    )
    result = fetcher.fetch("https://galvanizeit.org/knowledgebase/article/x")
    assert result is None
    assert fake_client.calls == []  # request never sent


def test_fetch_sends_identified_user_agent():
    fake_client = _FakeClient()
    fetcher = PoliteFetcher(
        contact_email="ingest@example.org", robots_gate=_allow_all_gate(), client=fake_client
    )
    fetcher.fetch("https://galvanizeit.org/knowledgebase/article/x")
    assert len(fake_client.calls) == 1
    assert fake_client.calls[0]["headers"]["User-Agent"] == fetcher.user_agent


def test_throttle_waits_between_requests(monkeypatch):
    clock = {"t": 0.0}
    sleeps: list[float] = []

    monkeypatch.setattr("galva_ingest.fetch.time.monotonic", lambda: clock["t"])
    monkeypatch.setattr("galva_ingest.fetch.time.sleep", lambda s: sleeps.append(s))

    fetcher = PoliteFetcher(
        contact_email="ingest@example.org",
        robots_gate=_allow_all_gate(),
        client=_FakeClient(),
        min_delay_seconds=2.5,
    )
    fetcher.fetch("https://galvanizeit.org/a")
    clock["t"] += 0.5  # only half a second passed before the next request
    fetcher.fetch("https://galvanizeit.org/b")

    assert sleeps == [2.0]  # waited the remaining 2.0s to reach the 2.5s floor


def test_login_wall_detected_by_redirect_url():
    fake_client = _FakeClient(response_url="https://galvanizeit.org/login?next=/secret")
    fetcher = PoliteFetcher(
        contact_email="ingest@example.org", robots_gate=_allow_all_gate(), client=fake_client
    )
    with pytest.raises(LoginWallDetected):
        fetcher.fetch("https://galvanizeit.org/secret")


def test_login_wall_detected_by_password_field_in_html():
    fake_client = _FakeClient(response_text='<form><input type="password" name="pw"></form>')
    fetcher = PoliteFetcher(
        contact_email="ingest@example.org", robots_gate=_allow_all_gate(), client=fake_client
    )
    with pytest.raises(LoginWallDetected):
        fetcher.fetch("https://galvanizeit.org/knowledgebase/article/x")


def test_ordinary_page_is_not_flagged_as_login_wall():
    fake_client = _FakeClient(response_text="<html><body>Coating thickness article</body></html>")
    fetcher = PoliteFetcher(
        contact_email="ingest@example.org", robots_gate=_allow_all_gate(), client=fake_client
    )
    assert fetcher.fetch("https://galvanizeit.org/knowledgebase/article/x") is not None
