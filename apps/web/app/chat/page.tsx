"use client";

import { useState } from "react";

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
          messages: nextMessages.map((m) => ({ role: m.role, content: m.content })),
          selectedStandard: selectedStandard || null,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "", error: data.detail || data.error || "Terjadi kesalahan." },
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
    <main className="min-h-screen flex flex-col p-8 sm:p-20 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Chat</h1>
      <p className="text-sm text-gray-500 mb-4">
        Tanya jawab hot dip galvanizing. Angka selalu dihitung tool, bukan ditebak model.
      </p>

      <label className="text-xs text-gray-500 mb-1">Standar (opsional)</label>
      <select
        className="mb-4 rounded-md border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm"
        value={selectedStandard}
        onChange={(e) => setSelectedStandard(e.target.value as SelectedStandard)}
      >
        <option value="">Belum dipilih</option>
        <option value="ASTM_A123">ASTM A123</option>
        <option value="ISO1461">ISO 1461</option>
        <option value="ASNZS4680">AS/NZS 4680</option>
      </select>

      <div className="flex-1 flex flex-col gap-4 mb-4 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            Contoh: &quot;Plate 10mm menurut ASTM A123 gradenya berapa?&quot;
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`rounded-lg border px-4 py-3 text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "border-black/10 dark:border-white/15 self-end bg-black/[.03] dark:bg-white/[.05]"
                : "border-black/10 dark:border-white/15"
            }`}
          >
            {m.error ? (
              <span className="text-red-500">{m.error}</span>
            ) : (
              <>
                {m.content}
                {m.confidence && m.confidence !== "ok" && (
                  <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                    {m.confidence === "no_context"
                      ? "⚠ Informasi terbatas — knowledge base tidak menemukan dokumen relevan."
                      : "⚠ Informasi terbatas — hasil retrieval kurang meyakinkan."}
                  </div>
                )}
                {m.citations && m.citations.length > 0 && (
                  <div className="mt-3 flex flex-col gap-1.5 border-t border-black/10 dark:border-white/15 pt-2">
                    {m.citations.map((c, j) => (
                      <a
                        key={j}
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        [{c.source}] {c.title}
                      </a>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
        {loading && <p className="text-sm text-gray-500">Memproses…</p>}
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 rounded-md border border-black/10 dark:border-white/15 bg-transparent px-3 py-2 text-sm"
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
          className="rounded-md bg-foreground text-background px-4 py-2 text-sm font-medium disabled:opacity-40"
        >
          Kirim
        </button>
      </div>
      {selectedStandard && (
        <p className="mt-2 text-xs text-gray-500">
          Standar terpilih: {STANDARD_LABELS[selectedStandard]}
        </p>
      )}
    </main>
  );
}
