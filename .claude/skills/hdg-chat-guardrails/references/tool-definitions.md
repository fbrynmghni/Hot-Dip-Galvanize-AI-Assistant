# Tool Definitions untuk OpenAI Function Calling

Disimpan di `apps/web/lib/llm/tools.ts`. Implementasinya ada di
`lib/tools/` dan `lib/rag/retrieve.ts` (lihat skill `hdg-engineering-tool`
dan `hdg-rag-ingest`).

Proyek ini memakai **OpenAI Chat Completions** (`gpt-5.5`), bukan Claude —
setiap entri dibungkus `{ type: "function", function: { name, description,
parameters } }`; `parameters` adalah JSON Schema yang sama isinya dengan
`input_schema` versi Anthropic, cuma nama field-nya beda.

```ts
export const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "check_coating_thickness",
      description:
        "Cek persyaratan ketebalan coating HDG minimum dan screening hasil ukur. " +
        "Standar: ASTM_A123 (wajib materialCategory + steelThickness + unit), " +
        "ISO1461 atau ASNZS4680 (wajib steelThicknessMm). " +
        "readingsUm = array of arrays: per specimen (ASTM) atau per reference area (ISO/AS).",
      parameters: {
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
  },
  {
    type: "function",
    function: {
      name: "compare_thickness_standards",
      description: "Bandingkan persyaratan ketebalan ASTM A123 vs ISO 1461 vs AS/NZS 4680 untuk baja yang sama.",
      parameters: {
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
  },
  {
    type: "function",
    function: {
      name: "estimate_durability",
      description: "Estimasi rentang umur coating berdasarkan ketebalan (µm) dan kategori korosivitas ISO 9223.",
      parameters: {
        type: "object",
        properties: {
          coatingUm: { type: "number" },
          category:  { type: "string", enum: ["C1", "C2", "C3", "C4", "C5", "CX"] },
        },
        required: ["coatingUm", "category"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "screen_steel_reactivity",
      description: "Screening reaktivitas baja terhadap zinc berdasarkan %Si dan %P (Sandelin).",
      parameters: {
        type: "object",
        properties: { siPct: { type: "number" }, pPct: { type: "number" } },
        required: ["siPct"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_knowledge",
      description:
        "Cari ulang dokumen AGA di knowledge base dengan query yang lebih spesifik, bila konteks " +
        "awal yang disisipkan sistem tidak cukup. Hasil HANYA dari artikel terbuka AGA -- GAA belum diindeks.",
      parameters: {
        type: "object",
        properties: {
          query:    { type: "string" },
          standard: { type: "string", enum: ["ASTM", "ISO/ASNZS"] },
        },
        required: ["query"],
      },
    },
  },
];
```

## Kenapa `required` di JSON Schema hanya berisi `standard`

Field wajib berbeda per standar, dan JSON Schema di tool definition tidak
mengekspresikan percabangan itu dengan baik. Validasi sebenarnya ada di Zod
`discriminatedUnion` di dalam tool (lihat `lib/tools/coating-thickness/schema.ts`).
Yang memandu model adalah teks `description` — karena itu `description`
**wajib** menyebut field wajib per varian secara eksplisit. Menghapus kalimat
itu membuat model memanggil tool dengan input tak lengkap dan menerima error,
alih-alih bertanya ke user lebih dulu.

## `search_knowledge` — kenapa ada di samping eager retrieval

Eager retrieval (lihat `references/orchestrator.md`) sudah menyisipkan konteks
sebelum turn pertama model. `search_knowledge` ada untuk follow-up: kalau user
bertanya lebih spesifik di tengah percakapan, model bisa mencari ulang dengan
query yang lebih tajam alih-alih terpaku pada konteks turn pertama. Keduanya
memanggil `retrieve()` yang sama di `lib/rag/retrieve.ts` -- bukan dua
implementasi retrieval yang berbeda.
