-- Supabase Postgres + pgvector

create extension if not exists vector;

create table documents (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('AGA','GAA')),
  url text unique not null,
  title text,
  section text,
  content_hash text not null,
  fetched_at timestamptz default now()
);

create table chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  chunk_index int,
  text text not null,
  standard_family text,
  topics text[],
  supersedes uuid[],                -- chunk edisi lama yang digantikan
  embedding vector(1024),
  tsv tsvector generated always as (to_tsvector('english', text)) stored
);

create index on chunks using hnsw (embedding vector_cosine_ops);
create index on chunks using gin (tsv);

create table chat_logs (
  id uuid primary key default gen_random_uuid(),
  question text,
  retrieved_chunk_ids uuid[],
  tool_calls jsonb,
  answer text,
  feedback smallint,          -- -1, 0, 1
  created_at timestamptz default now()
);

-- Catatan:
-- * tsv memakai konfigurasi 'english' karena dokumen sumber berbahasa Inggris.
--   Query berbahasa Indonesia diperluas ke istilah Inggris SEBELUM keyword
--   search (lihat query-expansion.md), bukan dengan mengganti konfigurasi ini.
-- * chat_logs tidak menyimpan data pribadi.
