import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { error: "not_implemented", detail: "Chat orchestrator belum dibangun — lihat skill hdg-chat-guardrails." },
    { status: 501 },
  );
}
