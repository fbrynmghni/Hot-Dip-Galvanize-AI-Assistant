from galva_ingest.chunk import chunk_markdown, chunk_section, split_by_heading, Section, _has_table


def test_split_by_heading_basic():
    md = "# Title\n\nIntro text.\n\n## Section A\n\nBody A.\n\n## Section B\n\nBody B."
    sections = split_by_heading(md)
    headings = [s.heading for s in sections]
    assert headings == ["Title", "Section A", "Section B"]


def test_split_by_heading_preserves_preamble_before_first_heading():
    md = "Some intro with no heading.\n\n# Real Heading\n\nBody."
    sections = split_by_heading(md, default_heading="intro")
    assert sections[0].heading == "intro"
    assert "Some intro" in sections[0].text
    assert sections[1].heading == "Real Heading"


def test_table_is_never_split_even_when_over_max_chars():
    table_rows = "\n".join(f"| Row {i} | {i * 10} |" for i in range(50))
    table_md = f"| Col A | Col B |\n|---|---|\n{table_rows}"
    section = Section(heading="Table 1", text=table_md, has_table=True)
    chunks = chunk_section(section, max_chars=100)  # deliberately tiny limit
    assert len(chunks) == 1
    assert "Row 49" in chunks[0]
    assert "Row 0" in chunks[0]


def test_non_table_section_splits_on_paragraph_boundaries_under_max_chars():
    paragraphs = [f"Paragraph number {i} with some filler text." for i in range(20)]
    section = Section(heading="Long Section", text="\n\n".join(paragraphs), has_table=False)
    chunks = chunk_section(section, max_chars=200)
    assert len(chunks) > 1
    for c in chunks:
        assert len(c) <= 250  # header prefix adds a little overhead
    # Every paragraph must survive somewhere -- chunking must not drop content.
    joined = " ".join(chunks)
    for p in paragraphs:
        assert p in joined


def test_has_table_requires_at_least_two_pipe_lines():
    # Regression: a single decorative pipe-wrapped line is not a real table
    # and must not exempt the whole section from paragraph-splitting.
    assert _has_table("| Note: cost is $10 or $20 |") is False


def test_has_table_true_for_real_header_plus_separator():
    assert _has_table("| Col A | Col B |\n|---|---|\n| 1 | 2 |") is True


def test_oversized_single_paragraph_is_wrapped_not_left_intact():
    # Regression: one paragraph alone longer than max_chars used to be
    # force-appended whole, silently violating the <=max_chars contract.
    section = Section(heading="H", text="word " * 800, has_table=False)  # ~4000 chars
    chunks = chunk_section(section, max_chars=500)
    assert len(chunks) > 1
    for c in chunks:
        assert len(c) <= 520  # small header-prefix overhead tolerance
    # No content lost: total word count preserved across chunks.
    assert sum(c.count("word") for c in chunks) == 800


def test_chunk_markdown_end_to_end_with_table_and_prose():
    md = (
        "# ASTM A123 Overview\n\n"
        "Some prose about the standard.\n\n"
        "## Table 1\n\n"
        "| Category | Grade |\n|---|---|\n| Plate | 75 |\n| Structural Shapes | 100 |\n"
    )
    chunks = chunk_markdown(md, max_chars=1500)
    headings = [h for h, _ in chunks]
    assert "ASTM A123 Overview" in headings
    assert "Table 1" in headings
    table_chunk = next(text for h, text in chunks if h == "Table 1")
    assert "| Plate | 75 |" in table_chunk
    assert "| Structural Shapes | 100 |" in table_chunk
