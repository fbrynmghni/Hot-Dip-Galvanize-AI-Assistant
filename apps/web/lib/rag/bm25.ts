/**
 * BM25 minimal -- "BM25 tidak opsional" (hdg-rag-ingest SKILL.md): istilah
 * seperti "A123"/"A153"/"Sandelin" adalah token persis yang sering meleset
 * di pencarian vektor murni. Tidak ada Postgres tsvector di sini (belum ada
 * DB), jadi BM25 dihitung langsung di memori atas korpus lokal.
 */

import { EXACT_TOKENS } from "./query-expansion";

const K1 = 1.5;
const B = 0.75;

// Diurutkan terpanjang dulu: "A123M" harus dicocokkan sebelum "A123", kalau
// tidak substring "a123" di dalam "a123m" akan dikonsumsi lebih dulu dan
// menyisakan "m" nyasar sebagai token generik terpisah -- "a123m" sendiri
// tidak akan pernah terbentuk.
const EXACT_TOKENS_LOWER = [...EXACT_TOKENS].map((t) => t.toLowerCase()).sort((a, b) => b.length - a.length);

export function tokenize(text: string): string[] {
  let remaining = text.toLowerCase();
  const tokens: string[] = [];

  // Token standar/efek (bisa multi-kata, mis. "as/nzs 4680") diekstrak dulu
  // apa adanya supaya tidak ikut hancur oleh pemecahan tanda baca generik.
  for (const exact of EXACT_TOKENS_LOWER) {
    if (remaining.includes(exact)) {
      tokens.push(exact);
      remaining = remaining.split(exact).join(" ");
    }
  }

  const generic = remaining.split(/[^a-z0-9]+/).filter(Boolean);
  return [...tokens, ...generic];
}

export interface BM25Doc {
  id: string;
  tokens: string[];
}

export function bm25Scores(query: string, docs: BM25Doc[]): Map<string, number> {
  const queryTerms = tokenize(query);
  const scores = new Map<string, number>(docs.map((d) => [d.id, 0]));
  if (docs.length === 0 || queryTerms.length === 0) return scores;

  const avgLen = docs.reduce((sum, d) => sum + d.tokens.length, 0) / docs.length;
  const df = new Map<string, number>();
  for (const term of new Set(queryTerms)) {
    df.set(term, docs.filter((d) => d.tokens.includes(term)).length);
  }

  for (const doc of docs) {
    let score = 0;
    const termCounts = new Map<string, number>();
    for (const t of doc.tokens) termCounts.set(t, (termCounts.get(t) ?? 0) + 1);

    for (const term of queryTerms) {
      const n = df.get(term) ?? 0;
      if (n === 0) continue;
      const idf = Math.log((docs.length - n + 0.5) / (n + 0.5) + 1);
      const tf = termCounts.get(term) ?? 0;
      if (tf === 0) continue;
      const denom = tf + K1 * (1 - B + (B * doc.tokens.length) / avgLen);
      score += idf * ((tf * (K1 + 1)) / denom);
    }
    scores.set(doc.id, score);
  }
  return scores;
}
