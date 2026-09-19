import { NextResponse } from "next/server";
import { z, ZodError } from "zod";
import type OpenAI from "openai";
import { getOpenAIClient, CHAT_MODEL } from "@/lib/llm/openai-client";
import { buildSystemPrompt } from "@/lib/llm/system-prompt";
import { tools } from "@/lib/llm/tools";
import { runTool } from "@/lib/llm/run-tool";
import { retrieve, dedupeChunks, type RetrievedChunk, type RetrieveResult } from "@/lib/rag/retrieve";

// Rate limit (Upstash) belum ada -- lihat CLAUDE.md arsitektur "Fase 2".
// Route ini belum dilindungi rate limit; jangan expose publik tanpa itu.

const ChatRequest = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1),
      }),
    )
    .min(1),
  selectedStandard: z.enum(["ASTM_A123", "ISO1461", "ASNZS4680"]).nullable().optional(),
});

const MAX_TOOL_STEPS = 5;
const MAX_COMPLETION_TOKENS = 2000; // gpt-5.5 reasoning model -- reasoning tokens ikut kuota ini
const CONFIDENCE_RANK: Record<RetrieveResult["confidence"], number> = { ok: 2, low: 1, no_context: 0 };

function contextBlock(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return "<context>\n(Tidak ada dokumen relevan ditemukan di knowledge base.)\n</context>";
  }
  const body = chunks
    .map((c) => `[${c.source}] ${c.title} — ${c.url}\n${c.text}`)
    .join("\n\n---\n\n");
  return `<context>\n${body}\n</context>`;
}

/** Ambil konfidensi tertinggi di antara semua panggilan retrieval di satu
 * step -- deterministik terhadap urutan penyelesaian Promise.all, tidak
 * bergantung siapa selesai duluan.
 */
function bestConfidence(a: RetrieveResult["confidence"], b: RetrieveResult["confidence"]) {
  return CONFIDENCE_RANK[a] >= CONFIDENCE_RANK[b] ? a : b;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  let input: z.infer<typeof ChatRequest>;
  try {
    input = ChatRequest.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "invalid_input", detail: err.issues }, { status: 400 });
    }
    throw err;
  }

  const systemPrompt = buildSystemPrompt(input.selectedStandard ?? null);
  const lastUserMessage = [...input.messages].reverse().find((m) => m.role === "user");

  let citations: RetrievedChunk[] = [];
  let confidence: RetrieveResult["confidence"] = "no_context";

  const convo: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = input.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  // Retrieval eager untuk pesan terakhir -- disisipkan sebagai bagian pesan
  // user (bukan system prompt), dibungkus <context>. Teks di dalamnya
  // berasal dari halaman web dan diperlakukan sebagai DATA, bukan instruksi
  // (lihat hdg-chat-guardrails aturan #6 dan orchestrator.md).
  if (lastUserMessage) {
    const standardFilter =
      input.selectedStandard === "ASTM_A123"
        ? "ASTM"
        : input.selectedStandard === "ISO1461" || input.selectedStandard === "ASNZS4680"
          ? "ISO/ASNZS"
          : undefined;
    const result = await retrieve(lastUserMessage.content, { standard: standardFilter });
    confidence = result.confidence;
    citations.push(...result.chunks);

    const lastIndex = convo.map((m) => m.role).lastIndexOf("user");
    if (lastIndex !== -1) {
      convo[lastIndex] = {
        role: "user",
        content: `${lastUserMessage.content}\n\n${contextBlock(result.chunks)}`,
      };
    }
  }

  const client = getOpenAIClient();
  const allMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...convo,
  ];

  try {
    for (let step = 0; step < MAX_TOOL_STEPS; step++) {
      const res = await client.chat.completions.create({
        model: CHAT_MODEL,
        messages: allMessages,
        tools,
        max_completion_tokens: MAX_COMPLETION_TOKENS,
      });

      const choice = res.choices[0];
      const message = choice.message;

      if (!message.tool_calls || message.tool_calls.length === 0) {
        citations = dedupeChunks(citations);
        if (choice.finish_reason === "length" && !message.content) {
          return NextResponse.json(
            {
              error: "truncated",
              detail: "Model kehabisan token (reasoning + output) sebelum sempat menjawab.",
              citations,
              confidence,
            },
            { status: 502 },
          );
        }
        return NextResponse.json({
          message: message.content ?? "",
          citations,
          confidence,
        });
      }

      allMessages.push(message);

      // Promise.all tidak boleh memutasi `confidence`/`citations` langsung di
      // dalam callback -- urutan penyelesaian network call bukan urutan
      // array, jadi hasilnya jadi tidak deterministik. Kumpulkan dulu, gabung
      // sesudah semua selesai.
      const toolCallResults = await Promise.all(
        message.tool_calls.map(async (call) => {
          if (call.type !== "function") {
            return {
              message: {
                tool_call_id: call.id,
                role: "tool" as const,
                content: JSON.stringify({ error: "unsupported_tool_call_type" }),
              },
              retrieval: null as RetrieveResult | null,
            };
          }
          let parsedArgs: unknown = {};
          try {
            parsedArgs = JSON.parse(call.function.arguments);
          } catch {
            return {
              message: {
                tool_call_id: call.id,
                role: "tool" as const,
                content: JSON.stringify({ error: "Argumen tool bukan JSON valid." }),
              },
              retrieval: null as RetrieveResult | null,
            };
          }
          const result = await runTool(call.function.name, parsedArgs);
          const isSearch =
            call.function.name === "search_knowledge" &&
            result !== null &&
            typeof result === "object" &&
            "chunks" in result;

          // search_knowledge mengembalikan hasil crawl AGA -- dibungkus
          // <context> di sini juga, sama seperti retrieval eager, supaya
          // model tetap memperlakukannya sebagai data yang bisa berisi
          // kalimat menyerupai instruksi, bukan instruksi sungguhan
          // (aturan #6/#10). Tool JSON Schema-nya (bukan konten dokumen)
          // yang tetap dikirim sebagai isi pesan tool.
          const retrieval = isSearch ? (result as RetrieveResult) : null;
          const content = isSearch
            ? JSON.stringify({ ...(result as RetrieveResult), context: contextBlock((result as RetrieveResult).chunks) })
            : JSON.stringify(result);

          return {
            message: { tool_call_id: call.id, role: "tool" as const, content },
            retrieval,
          };
        }),
      );

      for (const { retrieval } of toolCallResults) {
        if (!retrieval) continue;
        citations.push(...retrieval.chunks);
        confidence = bestConfidence(confidence, retrieval.confidence);
      }

      allMessages.push(...toolCallResults.map((r) => r.message));
    }

    return NextResponse.json(
      {
        error: "tool_loop_exceeded",
        detail: `Model masih memanggil tool setelah ${MAX_TOOL_STEPS} langkah -- dihentikan untuk mencegah loop tak berujung.`,
        citations: dedupeChunks(citations),
        confidence,
      },
      { status: 502 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "OpenAI API error";
    return NextResponse.json({ error: "llm_error", detail: message }, { status: 502 });
  }
}
