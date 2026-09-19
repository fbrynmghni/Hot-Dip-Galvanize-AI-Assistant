/**
 * Kamus di .claude/skills/hdg-rag-ingest/references/query-expansion.md.
 * Tambah entri di kedua tempat saat menemukan istilah yang gagal di-retrieve.
 */

interface Entry {
  id: string[];
  en: string;
}

const DICTIONARY: Entry[] = [
  { id: ["karat putih", "bercak putih", "noda putih"], en: "wet storage stain, white rust" },
  { id: ["lubang udara", "lubang angin"], en: "vent hole, venting, drainage" },
  {
    id: ["lapisan kusam", "abu-abu kusam", "tidak mengkilap"],
    en: "dull gray coating, reactive steel, silicon, Sandelin",
  },
  { id: ["ketebalan lapisan", "tebal coating"], en: "coating thickness, coating grade, minimum thickness" },
  { id: ["baja reaktif"], en: "reactive steel, silicon content, Sandelin effect" },
  { id: ["mengelupas", "lepas"], en: "flaking, peeling, adhesion failure" },
  { id: ["tidak terlapis", "kelupas kosong"], en: "bare spot, uncoated area, miss" },
  { id: ["perbaikan", "touch-up"], en: "repair, touch-up, ASTM A780, zinc-rich paint, metallizing" },
  { id: ["bengkok", "melengkung"], en: "distortion, warpage, ASTM A384" },
  { id: ["getas", "retak"], en: "embrittlement, hydrogen embrittlement, LMAC, ASTM A143" },
  { id: ["baut", "mur"], en: "fastener, bolt, nut, overtapping, ASTM A153, centrifuging" },
  { id: ["umur layanan", "tahan berapa lama"], en: "service life, time to first maintenance, durability" },
  { id: ["lingkungan pesisir"], en: "coastal, marine, C4, C5, ISO 9223 corrosivity" },
  { id: ["cat di atas galvanis"], en: "duplex system, painting over galvanizing, ASTM D6386, D7803" },
  { id: ["bak zinc", "tungku"], en: "kettle, galvanizing bath, molten zinc" },
  { id: ["endapan", "kerak dasar"], en: "dross, dross protrusion" },
  { id: ["abu permukaan"], en: "ash, ash inclusion" },
  { id: ["pencelupan bertahap"], en: "progressive dipping, double dipping" },
  { id: ["tulangan beton"], en: "reinforcing bar, rebar, ASTM A767" },
  { id: ["pembersihan asam"], en: "pickling, acid cleaning, mill scale" },
  { id: ["lapisan pelindung alami"], en: "patina, zinc carbonate" },
];

/** Nomor standar & nama efek -- jangan diterjemahkan/di-stem, selalu ikut BM25 apa adanya. */
export const EXACT_TOKENS = [
  "A123", "A123M", "A153", "A384", "A385", "A143", "A780", "A767", "E376", "A90",
  "D6386", "D7803", "ISO 1461", "ISO 2178", "ISO 1460", "ISO 9223", "AS/NZS 4680",
  "AS/NZS 4792", "AS/NZS 2312.2", "ISO 10684", "Sandelin", "FeZn13", "Gamma",
  "Delta", "Zeta", "Eta",
];

/**
 * Tambahkan istilah teknis Inggris ke query berbahasa Indonesia. Tidak
 * mengganti query asli -- hanya menambah, supaya token standar yang sudah
 * diketik user (mis. "A123") tetap ikut BM25 apa adanya.
 */
export function expandQuery(query: string): string {
  const lower = query.toLowerCase();
  const additions = DICTIONARY.filter((entry) => entry.id.some((phrase) => lower.includes(phrase)))
    .map((entry) => entry.en);
  return additions.length ? `${query} ${additions.join(", ")}` : query;
}
