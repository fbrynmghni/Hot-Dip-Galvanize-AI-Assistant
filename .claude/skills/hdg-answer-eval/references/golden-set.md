# Golden Set — Kasus Awal

20 kasus dasar. Target ≥ 150. Kolom "Poin wajib" adalah `must_include`
versi ringkas; saat dipindah ke format YAML, lengkapi dengan `expected_tool`,
`expected_tool_input`, `must_not_include`, dan `safety_points`.

| # | Pertanyaan | Poin wajib ada di jawaban |
|---|---|---|
| 1 | Berapa ketebalan minimum HDG plat 12 mm menurut ISO 1461? | Local 70 µm, mean 85 µm, via tool, sitasi |
| 2 | Kenapa hasil galvanis saya abu-abu kusam? | Si/P, Sandelin, bukan cacat bila spek terpenuhi |
| 3 | Hollow section boleh dicelup tanpa lubang? | **Tidak** — risiko ledakan, venting wajib |
| 4 | Apakah white rust membuat produk reject? | Tergantung tingkat; ringan umumnya accept |
| 5 | Bisakah HDG dicat? | Ya, duplex; persiapan ASTM D6386/D7803 |
| 6 | Baut HDG, mur perlu apa? | Overtapping |
| 7 | HDG 85 µm di lingkungan C4 tahan berapa lama? | Rentang via tool + rujuk estimator GAA |
| 8 | Bagaimana memperbaiki goresan HDG di lapangan? | ASTM A780: zinc-rich paint / solder / metallizing |
| 9 | Beda ASTM A123 dan A153? | Fabricated products vs hardware/fastener |
| 10 | Apa itu lapisan Zeta? | FeZn13, ~6% Fe, kolumnar |
| 11 | Ketebalan minimum ASTM A123 untuk rolled WF beam, web 9 mm, flange 14 mm? | Structural shapes, pakai bagian tertipis (web 9 mm) → Grade 100, individu min Grade 85 |
| 12 | Pipa 8 mm, standar ASTM A123, berapa minimumnya? | Grade 75 — pipe & tubing, bukan 100 |
| 13 | Baja 10 mm rata-rata 90 µm lolos ISO 1461, apakah lolos ASTM A123? | Tergantung kategori: plate → lolos (Grade 75); structural shapes → tidak (Grade 100) |
| 14 | Berapa ketebalan minimum untuk plat 8 mm? (tanpa standar) | AI bertanya standar ATAU tampilkan ketiganya berlabel |
| 15 | ASTM A123 minta ketebalan untuk baut M16? | Arahkan ke ASTM A153, bukan A123 |
| 16 | Plat 1,5 mm menurut ISO 1461 vs AS/NZS 4680? | Tampilkan perbedaan kelas di batas 1,5 mm + catatan verifikasi |
| 17 | Plate girder tebal ½ in pakai grade berapa di A123? | Kategori PLATE (bukan structural shapes) → Grade 75 |
| 18 | Pole dari plat bending 5/8 in, grade A123? | Kategori PLATE → Grade 100, bukan pipe & tubing |
| 19 | Rebar 3 mm menurut A123 Table 1? | Tidak didefinisikan → arahkan cek kategori / ASTM A767 |
| 20 | Area masking dihitung dalam batas repair? | Tidak — bukan accessible surface area (A123-24) |

## Kasus dengan penanganan khusus

**#3, #14** — `requires_clarification` atau `safety_points` menentukan lulus
tidaknya, bukan kecocokan angka.

- #3: jawaban wajib memuat peringatan ledakan. Jawaban yang benar secara teknis
  tapi menyebut venting hanya sebagai "praktik yang baik" dihitung **gagal**
  safety recall.
- #14: jawaban langsung dengan satu angka = gagal, walau angkanya cocok dengan
  salah satu standar.

**#13, #16, #17, #18** — kasus yang membedakan kategori material dan batas
standar. Inilah kelas kesalahan yang paling mahal; perbanyak kasus sejenis saat
menumbuhkan golden set.

**#19** — jawaban benar adalah `NOT_DEFINED` beserta arahan. Angka apa pun di
sini berarti model berinterpolasi.

## Arah penumbuhan ke 150

Prioritas, dari yang paling berisiko:

1. Satu kasus per sel Table 1 ASTM yang nilainya berubah di edisi 2024.
2. Satu kasus per titik batas setiap standar (ASTM 1,6/3,2/4,8/6,4/16 mm;
   ISO & AS/NZS 1,5/3/6 mm).
3. Satu kasus per kategori material ASTM (7 kategori), termasuk penentuan
   kategori yang berlawanan dengan intuisi (Appendix X1.1).
4. Kasus keselamatan: venting, embrittlement, progressive dipping.
5. Kasus troubleshooting dari matrix di
   `../../hdg-content-writer/references/domain-knowledge.md`.
6. Kasus out-of-domain dan kasus konteks lemah (harus berlabel "informasi
   terbatas").
