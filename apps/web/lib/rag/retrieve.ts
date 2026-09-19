/**
 * Retrieval lokal: hybrid search (BM25 + vektor) atas file JSON di
 * workers/ingest/.cache/ -- BELUM tersambung ke Postgres/pgvector (lihat
 * workers/ingest/README.md). Begitu ada DB, ganti loadChunks() dan
 * queryEmbedding() jadi query SQL; kontrak retrieve() tetap sama.
 */

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { getOpenAIClient, EMBEDDING_MODEL, EMBEDDING_DIM } from "../llm/openai-client";
import { expandQuery } from "./query-expansion";
import { bm25Scores, tokenize } from "./bm25";
import { cosineSimilarity } from "./vector";

export interface RetrievedChunk {
  source: "AGA" | "GAA";
  url: string;
  title: string;
  section: string;
  standard_family: "ASTM" | "ISO/ASNZS" | "general";
  text: string;
  content_hash: string;
}

interface CachedChunk extends RetrievedChunk {
  embedding?: number[];
}

export interface RetrieveOptions {
  standard?: "ASTM" | "ISO/ASNZS";
  cacheDir?: string;
  topK?: number;
}

export interface RetrieveResult {
  chunks: RetrievedChunk[];
  confidence: "ok" | "low" | "no_context";
}

// `next dev`/`next start` di-jalankan dari apps/web (npm workspaces), jadi
// process.cwd() adalah apps/web -- naik 2 level untuk sampai ke repo root.
// Override via INGEST_CACHE_DIR bila runtime cwd berbeda.
const DEFAULT_CACHE_DIR =
  process.env.INGEST_CACHE_DIR || join(process.cwd(), "..", "..", "workers", "ingest", ".cache");
const RRF_K = 60;
const LOW_CONFIDENCE_COSINE = 0.3;
const LOW_CONFIDENCE_BM25 = 0.5;

/**
 * content_hash sendirian bisa collide: dua halaman berbeda yang kebetulan
 * punya satu paragraf byte-identik (mis. boilerplate) menghasilkan hash yang
 * sama -- persis kasus yang sudah didokumentasikan & ditangani di
 * workers/ingest/src/galva_ingest/pipeline.py::_cache_key(). Gabungkan
 * dengan url supaya identitas chunk tetap unik di sisi retrieval juga.
 */
export function chunkKey(c: { url: string; content_hash: string }): string {
  return `${c.url}::${c.content_hash}`;
}

/** Dedup berdasarkan chunkKey(), mempertahankan urutan kemunculan pertama. */
export function dedupeChunks(chunks: RetrievedChunk[]): RetrievedChunk[] {
  const seen = new Set<string>();
  const result: RetrievedChunk[] = [];
  for (const c of chunks) {
    const key = chunkKey(c);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(c);
  }
  return result;
}

function loadChunks(cacheDir: string): CachedChunk[] {
  let files: string[];
  try {
    files = readdirSync(cacheDir).filter((f) => f.endsWith(".json"));
  } catch {
    return []; // .cache/ belum ada -- belum pernah crawl, bukan error.
  }
  return files
    .map((f) => {
      try {
        return JSON.parse(readFileSync(join(cacheDir, f), "utf-8")) as CachedChunk;
      } catch {
        return null;
      }
    })
    .filter((c): c is CachedChunk => c !== null);
}

async function queryEmbedding(query: string): Promise<number[] | null> {
  try {
    const client = getOpenAIClient();
    const res = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query,
      dimensions: EMBEDDING_DIM,
    });
    return res.data[0]?.embedding ?? null;
  } catch {
    return null; // OpenAI down/tanpa key -- retrieval jatuh ke BM25 saja, bukan crash.
  }
}

function reciprocalRankFusion(rankings: string[][]): Map<string, number> {
  const fused = new Map<string, number>();
  for (const ranking of rankings) {
    ranking.forEach((id, rank) => {
      fused.set(id, (fused.get(id) ?? 0) + 1 / (RRF_K + rank + 1));
    });
  }
  return fused;
}

function rankByScore(scores: Map<string, number>): string[] {
  return [...scores.entries()]
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
}

export async function retrieve(query: string, opts: RetrieveOptions = {}): Promise<RetrieveResult> {
  const cacheDir = opts.cacheDir ?? DEFAULT_CACHE_DIR;
  const topK = opts.topK ?? 6;

  const all = loadChunks(cacheDir);
  // "general" chunks (menyebut kedua keluarga standar) selalu diikutkan --
  // dikecualikan dari filter, bukan dari korpus, karena bisa relevan untuk
  // pertanyaan lintas-standar. Lihat hdg-rag-ingest source-map.md.
  const candidates = opts.standard
    ? all.filter((c) => c.standard_family === opts.standard || c.standard_family === "general")
    : all;

  if (candidates.length === 0) {
    return { chunks: [], confidence: "no_context" };
  }

  const expanded = expandQuery(query);
  const bm25Docs = candidates.map((c) => ({ id: chunkKey(c), tokens: tokenize(c.text) }));
  const bm25 = bm25Scores(expanded, bm25Docs);

  const qEmbedding = await queryEmbedding(expanded);
  const cosine = new Map<string, number>();
  if (qEmbedding) {
    for (const c of candidates) {
      if (c.embedding) cosine.set(chunkKey(c), cosineSimilarity(qEmbedding, c.embedding));
    }
  }

  const fused = reciprocalRankFusion([rankByScore(bm25), rankByScore(cosine)]);
  const byKey = new Map(candidates.map((c) => [chunkKey(c), c]));

  const ranked = [...fused.entries()].sort((a, b) => b[1] - a[1]).slice(0, topK);

  if (ranked.length === 0) {
    return { chunks: [], confidence: "no_context" };
  }

  const topKey = ranked[0][0];
  const topCosine = cosine.get(topKey) ?? 0;
  const topBm25 = bm25.get(topKey) ?? 0;
  // "ok" butuh SALAH SATU sinyal kuat (OR), bukan keduanya lemah sekaligus
  // dulu ditulis sebagai AND yang justru berarti "keduanya harus lemah" --
  // itu bug: saat embedding tidak tersedia (cosine selalu 0 di bawah
  // ambang), match BM25 super lemah tetap lolos sebagai "ok" karena bukan
  // persis nol. Sekarang eksplisit: perlu skor yang benar-benar meyakinkan
  // di salah satu sisi.
  const confidence: RetrieveResult["confidence"] =
    topCosine >= LOW_CONFIDENCE_COSINE || topBm25 >= LOW_CONFIDENCE_BM25 ? "ok" : "low";

  const chunks = dedupeChunks(
    ranked
      .map(([key]) => byKey.get(key))
      .filter((c): c is CachedChunk => c !== undefined)
      .map(toRetrievedChunk),
  );

  return { chunks, confidence };
}

function toRetrievedChunk(c: CachedChunk): RetrievedChunk {
  return {
    source: c.source,
    url: c.url,
    title: c.title,
    section: c.section,
    standard_family: c.standard_family,
    text: c.text,
    content_hash: c.content_hash,
  };
}
