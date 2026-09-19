"use client";

import { useState } from "react";
import { formatErrorDetail } from "@/lib/format-error-detail";

type Role = "user" | "assistant";
type SelectedStandard = "ASTM_A123" | "ISO1461" | "ASNZS4680" | "";

interface Citation {
  source: "AGA" | "GAA";
  url: string;
  title: string;
  section: string;
  standard_family: "ASTM" | "ISO/ASNZS" | "general";
}

interface ChatMessage {
  role: Role;
  content: string;
  citations?: Citation[];
  confidence?: "ok" | "low" | "no_context";
  error?: string;
}

const STANDARD_LABELS: Record<Exclude<SelectedStandard, "">, string> = {
  ASTM_A123: "ASTM A123",
  ISO1461: "ISO 1461",
  ASNZS4680: "AS/NZS 4680",
};

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [selectedStandard, setSelectedStandard] = useState<SelectedStandard>("");
  const [loading, setLoading] = useState(false);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((m) => !m.error)
            .map((m) => ({ role: m.role, content: m.content })),
          selectedStandard: selectedStandard || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "",
            error:
              formatErrorDetail(data.detail) ??
              (typeof data.error === "string" ? data.error : undefined) ??
              "Terjadi kesalahan.",
          },
        ]);
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message ?? "",
          citations: data.citations ?? [],
          confidence: data.confidence,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "", error: "Tidak bisa menghubungi server." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-10 sm:px-10">
      <p className="stamp-label mb-2">RAG · CHAT</p>
      <h1
        className="mb-2 text-2xl font-semibold uppercase tracking-wide text-steel-100"
        style={{ fontFamily: "var(--font-display)" }}
      >
        Chat
      </h1>
      <p className="mb-6 text-sm text-steel-300">
        Tanya jawab hot dip galvanizing. Angka selalu dihitung tool, bukan ditebak model.
      </p>

      <label className="stamp-label mb-1.5">Standar (opsional)</label>
      <select
        className="mb-6 w-fit rounded-md border border-panel-border bg-panel px-3 py-2 text-sm text-steel-100"
        value={selectedStandard}
        onChange={(e) => setSelectedStandard(e.target.value as SelectedStandard)}
      >
        <option value="">Belum dipilih</option>
        <option value="ASTM_A123">ASTM A123</option>
        <option value="ISO1461">ISO 1461</option>
        <option value="ASNZS4680">AS/NZS 4680</option>
      </select>

      <div className="mb-4 flex flex-1 flex-col gap-4 overflow-y-auto">
        {messages.length === 0 && (
          <p className="panel-riveted p-4 text-sm italic text-steel-300">
            Contoh: &quot;Plate 10mm menurut ASTM A123 gradenya berapa?&quot;
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] whitespace-pre-wrap rounded-md border px-4 py-3 text-sm ${
              m.role === "user"
                ? "self-end border-l-4 border-l-zinc-blue-bright border-y-panel-border border-r-panel-border bg-panel-raised text-steel-100"
                : "self-start border-l-4 border-l-kettle-red-bright border-y-panel-border border-r-panel-border bg-panel text-steel-100"
            }`}
          >
            {m.error ? (
              <span className="text-kettle-red-bright">{m.error}</span>
            ) : (
              <>
                {m.content}
                {m.confidence && m.confidence !== "ok" && (
                  <div className="mt-2 text-xs text-hazard-yellow">
                    {m.confidence === "no_context"
                      ? "⚠ Informasi terbatas — knowledge base tidak menemukan dokumen relevan."
                      : "⚠ Informasi terbatas — hasil retrieval kurang meyakinkan."}
                  </div>
                )}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5 border-t border-panel-border pt-2">
                    {m.citations.map((c, j) => (
                      <a
                        key={j}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-zinc-blue-bright hover:underline"
                      >
                        [{c.source}] {c.title}
                        {c.standard_family !== "general" && (
                          <span className="text-steel-400"> · {c.standard_family}</span>
                        )}
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {loading && <p className="text-sm text-steel-300">Memproses…</p>}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-panel-border bg-panel px-3 py-2 text-sm text-steel-100 placeholder:text-steel-400"
          value={input}
          placeholder="Tulis pertanyaan…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim()}
          className="btn-forge rounded-md px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          Kirim
        </button>
      </div>
      {selectedStandard && (
        <p className="stamp-label mt-2">
          Standar terpilih: {STANDARD_LABELS[selectedStandard]}
        </p>
      )}
    </main>
  );
}
