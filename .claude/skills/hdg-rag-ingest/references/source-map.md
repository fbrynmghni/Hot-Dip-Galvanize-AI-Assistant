# Peta Sumber & Taksonomi Topik

## AGA — galvanizeit.org (keluarga standar: ASTM)

- **Corrosion** — science, process, protection, effects
- **Hot-Dip Galvanizing** — what is galvanizing, HDG process, how long does HDG
  last, cost, zinc
- **Design & Fabrication** — design considerations, fabrication considerations
- **Specification & Inspection** — coating specs, duplex, AESS, inspection,
  repair, post-HDG
- **Dr. Galv KnowledgeBase** — **sumber Q&A paling bernilai**. Kategori:
  appearance, coating thickness, embrittlement, fasteners, HDG process,
  specifications, inspection, performance, reinforcing steel, steel selection,
  touch-up & repair, zinc coatings.
  - Prioritas tertinggi: artikel revisi standar, mis.
    *2024 Revision of ASTM A123*
    (https://galvanizeit.org/knowledgebase/article/2024-revision-of-astm-a123).
    Artikel revisi diberi metadata `supersedes`.
- **Publications**, **News**

## GAA — gaa.com.au (keluarga standar: ISO/ASNZS)

- Process, Design, Durability, Specification & Inspection, Sustainability,
  Painting
- FAQ, Glossary of Galvanizing Terms
- Technical Publications, Case Studies
- **Durability of Galvanizing Estimator**, **Life Cycle Costing Calculator** —
  **dirujuk via link, tidak di-scrape dan tidak di-clone**

## Penentuan `standard_family`

```python
def infer_standard_family(source: str, text: str) -> str:
    t = text.upper()
    if "ASTM" in t: return "ASTM"
    if "AS/NZS" in t or "ISO 1461" in t: return "ISO/ASNZS"
    return "ASTM" if source == "AGA" else "ISO/ASNZS"
```

Fallback berdasarkan `source` hanya dipakai bila teks tidak menyebut standar
mana pun. Chunk yang menyebut kedua keluarga standar sekaligus (mis. tabel
pembanding) ditandai `general` dan diberi perhatian khusus saat retrieval —
jangan sampai dipakai sebagai sumber angka untuk satu standar saja.

## Taksonomi topik

```ts
export const HDG_TOPICS = [
  "corrosion-basics", "process", "metallurgy", "steel-chemistry",
  "coating-thickness", "durability", "design-venting", "distortion",
  "welding", "embrittlement", "fasteners", "rebar", "inspection",
  "defects", "repair", "duplex-painting", "powder-coating",
  "storage-wet-storage-stain", "sustainability", "cost-lcc", "safety",
] as const;
```

Klasifikasi dilakukan LLM kecil (output JSON, divalidasi Zod), lalu
di-spot-check manual oleh engineer. Topik dipakai sebagai filter retrieval dan
untuk menyarankan pertanyaan kontekstual per halaman knowledge hub.

## Struktur chunk

```python
@dataclass
class Chunk:
    source: str            # "AGA" | "GAA"
    url: str
    title: str
    section: str           # mis. "Design & Fabrication"
    standard_family: str   # "ASTM" | "ISO/ASNZS" | "general"
    topics: list[str]
    text: str
    content_hash: str
```
