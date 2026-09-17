import json

from galva_ingest.pipeline import run


class _FakeFetcher:
    def __init__(self, html_by_url: dict[str, str], raise_for: set[str] = frozenset()) -> None:
        self._html_by_url = html_by_url
        self._raise_for = raise_for
        self.fetch_calls: list[str] = []

    def fetch(self, url: str) -> str | None:
        self.fetch_calls.append(url)
        if url in self._raise_for:
            raise RuntimeError(f"simulated failure for {url}")
        return self._html_by_url.get(url)

    def close(self) -> None:
        pass


class _FakeEmbedder:
    def __init__(self) -> None:
        self.embed_calls: list[list[str]] = []

    def embed(self, texts: list[str]) -> list[list[float]]:
        self.embed_calls.append(list(texts))
        return [[0.0] * 3 for _ in texts]


AGA_HTML = "<html><body><h1>Coating Thickness</h1><p>ASTM A123 sets Grade 100.</p></body></html>"
GAA_HTML = "<html><body><h1>Durability</h1><p>ISO 1461 sets 85 um mean.</p></body></html>"


def test_one_failing_url_does_not_abort_the_whole_batch(tmp_path):
    urls = (
        "https://galvanizeit.org/a",
        "https://galvanizeit.org/broken",
        "https://galvanizeit.org/b",
    )
    fetcher = _FakeFetcher(
        html_by_url={
            "https://galvanizeit.org/a": AGA_HTML,
            "https://galvanizeit.org/b": AGA_HTML,
        },
        raise_for={"https://galvanizeit.org/broken"},
    )
    embedder = _FakeEmbedder()

    chunks = run(urls=urls, cache_dir=tmp_path, fetcher=fetcher, embedder=embedder)

    # The broken URL is skipped, but a and b still get processed.
    assert fetcher.fetch_calls == list(urls)
    assert len(chunks) > 0
    assert all(c.url in ("https://galvanizeit.org/a", "https://galvanizeit.org/b") for c in chunks)


def test_chunks_are_stamped_with_source_derived_from_url_not_hardcoded(tmp_path):
    fetcher = _FakeFetcher(html_by_url={"https://galvanizeit.org/a": AGA_HTML})
    embedder = _FakeEmbedder()
    chunks = run(urls=("https://galvanizeit.org/a",), cache_dir=tmp_path, fetcher=fetcher, embedder=embedder)
    assert all(c.source == "AGA" for c in chunks)


def test_unchanged_content_is_not_re_embedded_on_second_run(tmp_path):
    url = "https://galvanizeit.org/a"
    fetcher1 = _FakeFetcher(html_by_url={url: AGA_HTML})
    embedder1 = _FakeEmbedder()
    run(urls=(url,), cache_dir=tmp_path, fetcher=fetcher1, embedder=embedder1)
    first_embed_call_count = len(embedder1.embed_calls)
    assert first_embed_call_count > 0

    # Second run, identical content -- must skip re-embedding entirely.
    fetcher2 = _FakeFetcher(html_by_url={url: AGA_HTML})
    embedder2 = _FakeEmbedder()
    run(urls=(url,), cache_dir=tmp_path, fetcher=fetcher2, embedder=embedder2)
    assert embedder2.embed_calls == []


def test_changed_content_is_re_embedded(tmp_path):
    url = "https://galvanizeit.org/a"
    run(urls=(url,), cache_dir=tmp_path, fetcher=_FakeFetcher({url: AGA_HTML}), embedder=_FakeEmbedder())

    changed_html = AGA_HTML.replace("Grade 100", "Grade 75")
    embedder2 = _FakeEmbedder()
    run(urls=(url,), cache_dir=tmp_path, fetcher=_FakeFetcher({url: changed_html}), embedder=embedder2)
    assert len(embedder2.embed_calls) > 0


def test_cache_files_are_written_with_embedding(tmp_path):
    url = "https://galvanizeit.org/a"
    run(urls=(url,), cache_dir=tmp_path, fetcher=_FakeFetcher({url: AGA_HTML}), embedder=_FakeEmbedder())
    cached_files = list(tmp_path.glob("*.json"))
    assert len(cached_files) > 0
    payload = json.loads(cached_files[0].read_text())
    assert payload["source"] == "AGA"
    assert "embedding" in payload
