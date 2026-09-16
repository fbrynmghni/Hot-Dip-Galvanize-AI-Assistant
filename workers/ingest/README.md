# Ingestion worker

Crawler + chunker + embedder untuk AGA (galvanizeit.org) dan GAA (gaa.com.au).
Belum diimplementasikan — direncanakan Fase 1. Prosedur dan gate legal wajib
dibaca dulu: `.claude/skills/hdg-rag-ingest/` (lihat khususnya
`references/legal.md` sebelum crawling apa pun).

Rencana dependency (lihat `CLAUDE.md` tech stack): `httpx`, `trafilatura`,
`pdfplumber`, `pydantic`, klien embedding OpenAI (`text-embedding-3-large`,
lihat `.env.example`).
