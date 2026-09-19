"""Starter seed list -- AGA saja untuk sekarang (lihat robots.py). Bukan
daftar lengkap; ini sengaja kecil untuk membuktikan pipeline bekerja end-to-end
sebelum diperluas lewat sitemap (https://galvanizeit.org/sitemaps-1-sitemap.xml).

Setiap URL diverifikasi ada (dicek manual via pencarian) sebelum dimasukkan --
jangan menambah URL yang belum dikonfirmasi benar-benar ada.
"""

from __future__ import annotations

AGA_SEED_URLS: tuple[str, ...] = (
    # Prioritas tertinggi per source-map.md: artikel revisi standar.
    "https://galvanizeit.org/knowledgebase/article/2024-revision-of-astm-a123",
    "https://galvanizeit.org/knowledgebase/article/iso-1461",
    "https://galvanizeit.org/knowledgebase/article/iso-1461-and-astm-a123",
    # Dr. Galv KnowledgeBase -- kategori appearance/defects.
    "https://galvanizeit.org/knowledgebase/article/wet-storage-stain",
    "https://galvanizeit.org/knowledgebase/article/how-to-clean-wet-storage-stain",
    "https://galvanizeit.org/knowledgebase/article/damage-caused-by-wet-storage-stain",
)

# GAA belum di-crawl -- lihat robots.py ALLOWED_HOSTS / BLOCKED_HOSTS_REASON.
GAA_SEED_URLS: tuple[str, ...] = ()
