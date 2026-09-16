# Kamus Query Expansion — Indonesia → Istilah Teknis Inggris

Dokumen sumber berbahasa Inggris; pertanyaan user berbahasa Indonesia. Tanpa
perluasan ini, pencarian keyword hampir selalu meleset dan pencarian vektor
kehilangan presisi pada istilah teknis.

Tumbuhkan tabel ini setiap kali ditemukan istilah yang gagal di-retrieve.

| Istilah user (ID) | Diperluas ke (EN) |
|---|---|
| karat putih, bercak putih, noda putih | wet storage stain, white rust |
| lubang udara, lubang angin | vent hole, venting, drainage |
| lapisan kusam, abu-abu kusam, tidak mengkilap | dull gray coating, reactive steel, silicon, Sandelin |
| ketebalan lapisan, tebal coating | coating thickness, coating grade, minimum thickness |
| baja reaktif | reactive steel, silicon content, Sandelin effect |
| mengelupas, lepas | flaking, peeling, adhesion failure |
| tidak terlapis, kelupas kosong | bare spot, uncoated area, miss |
| perbaikan, touch-up | repair, touch-up, ASTM A780, zinc-rich paint, metallizing |
| bengkok, melengkung | distortion, warpage, ASTM A384 |
| getas, retak | embrittlement, hydrogen embrittlement, LMAC, ASTM A143 |
| baut, mur | fastener, bolt, nut, overtapping, ASTM A153, centrifuging |
| umur layanan, tahan berapa lama | service life, time to first maintenance, durability |
| lingkungan pesisir | coastal, marine, C4, C5, ISO 9223 corrosivity |
| cat di atas galvanis | duplex system, painting over galvanizing, ASTM D6386, D7803 |
| bak zinc, tungku | kettle, galvanizing bath, molten zinc |
| endapan, kerak dasar | dross, dross protrusion |
| abu permukaan | ash, ash inclusion |
| pencelupan bertahap | progressive dipping, double dipping |
| tulangan beton | reinforcing bar, rebar, ASTM A767 |
| pembersihan asam | pickling, acid cleaning, mill scale |
| lapisan pelindung alami | patina, zinc carbonate |

## Istilah yang WAJIB dipertahankan apa adanya di BM25

Nomor standar dan nama efek adalah token persis. Jangan diterjemahkan, jangan
di-stem, dan pastikan ikut ke keyword search:

`A123`, `A123M`, `A153`, `A384`, `A385`, `A143`, `A780`, `A767`, `E376`, `A90`,
`D6386`, `D7803`, `ISO 1461`, `ISO 2178`, `ISO 1460`, `ISO 9223`, `AS/NZS 4680`,
`AS/NZS 4792`, `AS/NZS 2312.2`, `ISO 10684`, `Sandelin`, `FeZn13`, `Gamma`,
`Delta`, `Zeta`, `Eta`.

Inilah alasan hybrid search: pencarian vektor murni akan menganggap "A123" dan
"A153" nyaris identik, padahal keduanya standar untuk produk yang berbeda.
