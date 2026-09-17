"""Embedding lewat OpenAI API. Model & dimensi dibaca dari env (harus cocok
dengan kolom `vector(n)` di schema.sql -- lihat .env.example).
"""

from __future__ import annotations

import os

from openai import OpenAI

DEFAULT_MODEL = "text-embedding-3-large"
DEFAULT_DIM = 1024


class Embedder:
    def __init__(
        self,
        client: OpenAI | None = None,
        model: str | None = None,
        dimensions: int | None = None,
    ) -> None:
        self._client = client or OpenAI()
        self._model = model or os.environ.get("OPENAI_EMBEDDING_MODEL", DEFAULT_MODEL)
        dim_env = os.environ.get("OPENAI_EMBEDDING_DIM")
        self._dimensions = dimensions or (int(dim_env) if dim_env else DEFAULT_DIM)

    def embed(self, texts: list[str]) -> list[list[float]]:
        if not texts:
            return []
        response = self._client.embeddings.create(
            model=self._model,
            input=texts,
            dimensions=self._dimensions,
        )
        return [item.embedding for item in response.data]
