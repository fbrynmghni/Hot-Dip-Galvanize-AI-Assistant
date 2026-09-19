from galva_ingest.metadata import content_hash, infer_standard_family, source_from_url


def test_content_hash_is_deterministic():
    assert content_hash("hello") == content_hash("hello")


def test_content_hash_differs_for_different_text():
    assert content_hash("hello") != content_hash("world")


def test_infer_astm_only():
    assert infer_standard_family("AGA", "Per ASTM A123, the grade is 100.") == "ASTM"


def test_infer_iso_only():
    assert infer_standard_family("GAA", "AS/NZS 4680 requires 85 microns.") == "ISO/ASNZS"


def test_infer_iso_1461_variant_without_asnzs_token():
    assert infer_standard_family("GAA", "ISO 1461 sets a mean minimum of 85 um.") == "ISO/ASNZS"


def test_infer_recognizes_iso_2178_1460_10684_as_iso_family():
    # Regression: these were canonical exact tokens in
    # apps/web/lib/rag/query-expansion.ts's EXACT_TOKENS but missing from
    # this function's marker list, so an AGA chunk about e.g. ISO 2178
    # (thickness gauging) with no "ASTM" mention fell through to the
    # source-based "ASTM" default -- mislabeling ISO content.
    assert infer_standard_family("AGA", "Measured per ISO 2178 using magnetic gauges.") == "ISO/ASNZS"
    assert infer_standard_family("AGA", "ISO 1460 covers gravimetric testing.") == "ISO/ASNZS"
    assert infer_standard_family("AGA", "Fasteners per ISO 10684 need care.") == "ISO/ASNZS"


def test_mentions_both_standards_is_general_not_first_match():
    # Regression: naive if/elif (ASTM checked first) would misclassify a
    # comparison table as "ASTM" even though it also cites ISO/AS-NZS --
    # exactly the standard-mixing CLAUDE.md rule #3 forbids.
    text = "ASTM A123 requires Grade 100 while ISO 1461 requires 85 um mean."
    assert infer_standard_family("AGA", text) == "general"


def test_fallback_to_source_when_no_standard_mentioned():
    assert infer_standard_family("AGA", "Zinc coatings protect steel from corrosion.") == "ASTM"
    assert infer_standard_family("GAA", "Zinc coatings protect steel from corrosion.") == "ISO/ASNZS"


def test_infer_iso_9223_is_recognized_as_iso_family():
    # Regression: ISO 9223 (corrosivity categories, packages/engineering-config/
    # iso9223-zinc.v1.json) was missing from the ISO-family marker list, so an
    # AGA-sourced chunk about it silently fell through to the "ASTM" default.
    text = "ISO 9223 defines corrosivity categories C1 through CX."
    assert infer_standard_family("AGA", text) == "ISO/ASNZS"


def test_source_from_url_maps_known_hosts():
    assert source_from_url("https://galvanizeit.org/knowledgebase/article/x") == "AGA"
    assert source_from_url("https://gaa.com.au/some/page") == "GAA"


def test_source_from_url_raises_for_unknown_host():
    import pytest

    with pytest.raises(ValueError):
        source_from_url("https://example.com/page")
