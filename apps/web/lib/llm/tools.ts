/**
 * Tool definitions untuk OpenAI function calling (Chat Completions `tools`).
 * Diadaptasi dari .claude/skills/hdg-chat-guardrails/references/tool-definitions.md
 * (ditulis untuk Claude `input_schema`) -- proyek ini memakai OpenAI, lihat
 * CLAUDE.md tech stack dan .env.example.
 *
 * `description` WAJIB menyebut field wajib per varian standar -- itu yang
 * dibaca model saat memutuskan apakah informasinya cukup atau harus
 * bertanya balik ke user, karena JSON Schema `required` di bawah tidak bisa
 * mengekspresikan percabangan per-standar (validasi sesungguhnya ada di Zod,
 * di dalam setiap fungsi tool -- lihat lib/tools/).
 */

import type OpenAI from "openai";

const MATERIAL_CATEGORY_ENUM = [
  "STRUCTURAL_SHAPES",
  "STRIP_BAR",
  "PLATE",
  "PIPE_TUBING",
  "WIRE",
  "REINFORCING_BAR",
  "FORGINGS_CASTINGS",
] as const;

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
            enum: MATERIAL_CATEGORY_ENUM,
            description: "Wajib untuk ASTM_A123",
          },
          steelThickness: { type: "number", description: "Untuk ASTM_A123" },
          unit: { type: "string", enum: ["mm", "in"], description: "Untuk ASTM_A123, default mm" },
          steelThicknessMm: { type: "number", description: "Untuk ISO1461 / ASNZS4680" },
          isCasting: { type: "boolean", description: "Hanya ISO1461" },
          readingsUm: { type: "array", items: { type: "array", items: { type: "number" } } },
        },
        required: ["standard"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_thickness_standards",
      description:
        "Bandingkan persyaratan ketebalan ASTM A123 vs ISO 1461 vs AS/NZS 4680 untuk baja yang sama.",
      parameters: {
        type: "object",
        properties: {
          steelThicknessMm: { type: "number" },
          materialCategory: { type: "string", enum: MATERIAL_CATEGORY_ENUM },
        },
        required: ["steelThicknessMm", "materialCategory"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "estimate_durability",
      description:
        "Estimasi rentang umur coating berdasarkan ketebalan (µm) dan kategori korosivitas ISO 9223.",
      parameters: {
        type: "object",
        properties: {
          coatingUm: { type: "number" },
          category: { type: "string", enum: ["C1", "C2", "C3", "C4", "C5", "CX"] },
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
        properties: {
          siPct: { type: "number" },
          pPct: { type: "number" },
        },
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
        "awal yang disisipkan sistem tidak cukup menjawab pertanyaan user. Hasil HANYA dari artikel " +
        "terbuka AGA (galvanizeit.org) -- GAA belum diindeks.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string" },
          standard: { type: "string", enum: ["ASTM", "ISO/ASNZS"] },
        },
        required: ["query"],
      },
    },
  },
];
