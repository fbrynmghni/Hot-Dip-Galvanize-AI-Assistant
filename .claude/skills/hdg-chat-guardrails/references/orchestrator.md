# Orchestrator `/api/chat`

```ts
// app/api/chat/route.ts
export async function POST(req: Request) {
  const { messages, selectedStandard } = await req.json();
  // selectedStandard: "ASTM_A123" | "ISO1461" | "ASNZS4680" | null (dari selector UI)
  await rateLimit(req);

  const SYSTEM_PROMPT =
    `${BASE_PROMPT}\n<selected_standard>${selectedStandard ?? "BELUM_DIPILIH"}</selected_standard>`;

  let convo = [...messages];

  for (let step = 0; step < 5; step++) {          // batasi loop tool
    const res = await anthropic.messages.create({
      model: "claude-sonnet-5",
      system: SYSTEM_PROMPT,
      tools,
      max_tokens: 1500,
      messages: convo,
    });

    if (res.stop_reason !== "tool_use") return streamToClient(res);

    const toolResults = await Promise.all(
      res.content.filter(b => b.type === "tool_use").map(async b => ({
        type: "tool_result",
        tool_use_id: b.id,
        content: JSON.stringify(await runTool(b.name, b.input)),  // validasi Zod di dalam
      }))
    );

    convo.push(
      { role: "assistant", content: res.content },
      { role: "user", content: toolResults },
    );
  }

  return fallbackAnswer();
}
```

## Penanganan error tool

Error Zod dikembalikan **apa adanya** ke model sebagai `tool_result`, bukan
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

## Menyisipkan konteks retrieval

Hasil retrieval masuk sebagai bagian dari pesan user, dibungkus `<context>`,
**tidak pernah** digabung ke system prompt:

```ts
const contextBlock =
  `<context>\n${chunks.map(c => `[${c.source}] ${c.title} — ${c.url}\n${c.text}`).join("\n\n")}\n</context>`;
```

Teks di dalam `<context>` berasal dari halaman web dan bisa memuat kalimat yang
menyerupai instruksi. System prompt sudah menyatakan bahwa isinya adalah data.

## Streaming & UI

- Jawaban di-stream; kartu sitasi (judul, sumber, link) dirender dari metadata
  chunk yang dipakai.
- Angka hasil tool diberi badge "dihitung oleh tool", dibedakan dari narasi.
- Tombol feedback 👍/👎 + alasan → `/api/feedback` → tabel `chat_logs`.

## Rate limit & auth

Rate limit (mis. Upstash) dijalankan **sebelum** pemanggilan model. Auth
opsional (Supabase Auth) untuk kuota per user.

## Endpoint terkait

| Endpoint | Method | Fungsi |
|---|---|---|
| `/api/chat` | POST | Chat dengan RAG + tools (streaming) |
| `/api/tools/thickness` | POST | Coating thickness checker |
| `/api/tools/durability` | POST | Durability estimator |
| `/api/tools/reactivity` | POST | Steel reactivity screener |
| `/api/feedback` | POST | Simpan feedback |
| `/api/admin/reindex` | POST | Trigger re-ingestion (protected) |
