# Tool Definitions untuk Claude

Disimpan di `apps/web/lib/llm/tools.ts`. Implementasinya ada di
`lib/tools/` (lihat skill `hdg-engineering-tool`).

```ts
export const tools = [
  {
    name: "check_coating_thickness",
    description:
      "Cek persyaratan ketebalan coating HDG minimum dan screening hasil ukur. " +
      "Standar: ASTM_A123 (wajib materialCategory + steelThickness + unit), " +
      "ISO1461 atau ASNZS4680 (wajib steelThicknessMm). " +
      "readingsUm = array of arrays: per specimen (ASTM) atau per reference area (ISO/AS).",
    input_schema: {
      type: "object",
      properties: {
        standard: { type: "string", enum: ["ASTM_A123", "ISO1461", "ASNZS4680"] },
        materialCategory: {
          type: "string",
          enum: ["STRUCTURAL_SHAPES", "STRIP_BAR", "PLATE", "PIPE_TUBING",
                 "WIRE", "REINFORCING_BAR", "FORGINGS_CASTINGS"],
          description: "Wajib untuk ASTM_A123",
        },
        steelThickness:   { type: "number", description: "Untuk ASTM_A123" },
        unit:             { type: "string", enum: ["mm", "in"], description: "Untuk ASTM_A123, default mm" },
        steelThicknessMm: { type: "number", description: "Untuk ISO1461 / ASNZS4680" },
        isCasting:        { type: "boolean", description: "Hanya ISO1461" },
        readingsUm: { type: "array", items: { type: "array", items: { type: "number" } } },
      },
      required: ["standard"],   // field lain divalidasi Zod per standar
    },
  },
  {
    name: "compare_thickness_standards",
    description: "Bandingkan persyaratan ketebalan ASTM A123 vs ISO 1461 vs AS/NZS 4680 untuk baja yang sama.",
    input_schema: {
      type: "object",
      properties: {
        steelThicknessMm: { type: "number" },
        materialCategory: {
          type: "string",
          enum: ["STRUCTURAL_SHAPES", "STRIP_BAR", "PLATE", "PIPE_TUBING",
                 "WIRE", "REINFORCING_BAR", "FORGINGS_CASTINGS"],
        },
      },
      required: ["steelThicknessMm", "materialCategory"],
    },
  },
  {
    name: "estimate_durability",
    description: "Estimasi rentang umur coating berdasarkan ketebalan (µm) dan kategori korosivitas ISO 9223.",
    input_schema: {
      type: "object",
      properties: {
        coatingUm: { type: "number" },
        category:  { type: "string", enum: ["C1", "C2", "C3", "C4", "C5", "CX"] },
      },
      required: ["coatingUm", "category"],
    },
  },
  {
    name: "screen_steel_reactivity",
    description: "Screening reaktivitas baja terhadap zinc berdasarkan %Si dan %P (Sandelin).",
    input_schema: {
      type: "object",
      properties: { siPct: { type: "number" }, pPct: { type: "number" } },
      required: ["siPct"],
    },
  },
  {
    name: "search_knowledge",
    description: "Cari dokumen AGA/GAA yang relevan.",
    input_schema: {
      type: "object",
      properties: {
        query:    { type: "string" },
        standard: { type: "string", enum: ["ASTM", "ISO/ASNZS"] },
      },
      required: ["query"],
    },
  },
];
```

## Kenapa `required` hanya berisi `standard`

Field wajib berbeda per standar, dan JSON Schema di tool definition tidak
mengekspresikan percabangan itu dengan baik. Validasi sebenarnya ada di Zod
`discriminatedUnion` di dalam `runTool`. Yang memandu model adalah teks
`description` — karena itu `description` **harus** menyebut field wajib per
varian secara eksplisit. Menghapus kalimat itu membuat model memanggil tool
dengan input tak lengkap dan menerima error, alih-alih bertanya ke user lebih
dulu.
