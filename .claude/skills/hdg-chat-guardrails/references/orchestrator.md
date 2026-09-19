# Orchestrator `/api/chat`

Proyek ini memakai **OpenAI** (`gpt-5.5`), bukan Claude — lihat CLAUDE.md tech
stack dan `.env.example`. Bentuk API tool-calling-nya berbeda dari Anthropic:
OpenAI memakai `tool_calls` pada `message`, bukan content block `tool_use`,
dan hasil tool dikirim balik sebagai pesan `role: "tool"` dengan `tool_call_id`
— bukan `tool_result` di dalam pesan `user`.

`gpt-5.5` adalah **reasoning model**: pakai `max_completion_tokens`, BUKAN
`max_tokens`; reasoning token ikut ditagih dari kuota itu. Budget terlalu
kecil membuat `finish_reason: "length"` dengan `content` kosong (reasoning
menghabiskan jatah sebelum sempat menjawab) — cek kondisi ini secara eksplisit,
jangan biarkan lolos sebagai jawaban kosong.

```ts
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages, selectedStandard } = ChatRequest.parse(await req.json());
  // selectedStandard: "ASTM_A123" | "ISO1461" | "ASNZS4680" | null (dari selector UI)
  // Rate limit (Upstash) belum ada -- lihat catatan di bawah.

  const systemPrompt = buildSystemPrompt(selectedStandard);
  const convo: ChatCompletionMessageParam[] = [...messages];
  // ...sisipkan <context> hasil retrieval ke pesan user terakhir (lihat di bawah)

  const allMessages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...convo,
  ];

  for (let step = 0; step < 5; step++) {              // batasi loop tool
    const res = await client.chat.completions.create({
      model: "gpt-5.5",
      messages: allMessages,
      tools,
      max_completion_tokens: 2000,
    });

    const message = res.choices[0].message;
    if (!message.tool_calls?.length) {
      if (res.choices[0].finish_reason === "length" && !message.content) {
        return truncatedError();                       // reasoning menghabiskan kuota
      }
      return NextResponse.json({ message: message.content, citations, confidence });
    }

    allMessages.push(message);
    const toolResults = await Promise.all(
      message.tool_calls.map(async (call) => ({
        role: "tool" as const,
        tool_call_id: call.id,
        content: JSON.stringify(await runTool(call.function.name, JSON.parse(call.function.arguments))),
      }))
    );
    allMessages.push(...toolResults);
  }
  return fallbackAnswer();                             // loop 5x tanpa resolusi
}
```

## Penanganan error tool

Error Zod dikembalikan **apa adanya** ke model sebagai isi pesan `tool`, bukan
ditelan jadi pesan generik:

```ts
async function runTool(name: string, input: unknown) {
  try {
    return await TOOL_IMPL[name](input);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}
```

Pesan Zod menyebut field mana yang hilang, dan itulah yang membuat model
bertanya balik ke user ("kategori materialnya apa?") alih-alih menebak.

Setiap fungsi di `TOOL_IMPL` menerima `raw: unknown` dan memvalidasi sendiri
lewat Zod di dalam — lihat `hdg-engineering-tool/references/existing-tools.md`
bagian "Kenapa `raw: unknown` di semua tool". `runTool` di atas cuma
dispatcher tipis; jangan taruh validasi di sini.

## Menyisipkan konteks retrieval

Ada **dua jalur** retrieval yang saling melengkapi, bukan salah satu:

1. **Eager, sebelum turn pertama model.** Query user terakhir langsung
   dipakai memanggil `retrieve()` (skill `hdg-rag-ingest`), hasilnya
   disisipkan ke **pesan user** (bukan system prompt), dibungkus `<context>`:

   ```ts
   const contextBlock =
     `<context>\n${chunks.map(c => `[${c.source}] ${c.title} — ${c.url}\n${c.text}`).join("\n\n")}\n</context>`;
   ```

2. **Agentic, lewat tool `search_knowledge`.** Kalau konteks awal tidak cukup
   (mis. user bertanya lebih spesifik di follow-up), model bisa memanggil
   tool ini untuk mencari ulang dengan query yang lebih tajam. Ini
   men-*dispatch* ke fungsi `retrieve()` yang sama, bukan implementasi kedua.

Teks di dalam `<context>` berasal dari halaman web dan bisa memuat kalimat
yang menyerupai instruksi. System prompt sudah menyatakan bahwa isinya adalah
data, dan `<context>` **tidak pernah** digabung ke system prompt di jalur mana pun.

## Confidence & sitasi

`retrieve()` mengembalikan `confidence: "ok" | "low" | "no_context"`.
Kumpulkan semua chunk yang benar-benar dipakai (dari eager retrieval maupun
`search_knowledge`) sebagai `citations` di response API — dipakai UI untuk
kartu sitasi, dan dipakai model untuk tahu kapan harus bilang "konteks tidak
cukup" alih-alih mengarang.

## Streaming & UI

- **Belum di-stream di v1** — response JSON penuh, bukan SSE. Cukup untuk
  membuktikan orchestrator benar sebelum menambah kompleksitas streaming.
- Angka hasil tool diberi badge "dihitung oleh tool", dibedakan dari narasi.
- Tombol feedback 👍/👎 + alasan → `/api/feedback` (belum diimplementasikan).

## Rate limit & auth

**Belum ada** — Upstash rate limit dan Supabase Auth direncanakan Fase 2.
Jangan expose route ini publik tanpa rate limit terpasang lebih dulu.

## Endpoint terkait

| Endpoint | Method | Fungsi | Status |
|---|---|---|---|
| `/api/chat` | POST | Chat dengan RAG + tools (non-streaming) | Diimplementasikan |
| `/api/tools/[name]` | POST | Dispatcher kalkulator (thickness/compare/durability/reactivity) | Diimplementasikan |
| `/api/feedback` | POST | Simpan feedback | Belum |
| `/api/admin/reindex` | POST | Trigger re-ingestion (protected) | Belum |
