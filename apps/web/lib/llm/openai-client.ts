import OpenAI from "openai";

let client: OpenAI | null = null;

/** Lazy singleton -- konstruksi OpenAI() di module scope akan melempar saat
 * build/test time bila OPENAI_API_KEY belum ada di env (mis. CI, vitest).
 */
export function getOpenAIClient(): OpenAI {
  if (!client) client = new OpenAI();
  return client;
}

export const CHAT_MODEL = process.env.OPENAI_MODEL || "gpt-5.5";
export const EMBEDDING_MODEL = process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-3-large";
export const EMBEDDING_DIM = Number(process.env.OPENAI_EMBEDDING_DIM) || 1024;
