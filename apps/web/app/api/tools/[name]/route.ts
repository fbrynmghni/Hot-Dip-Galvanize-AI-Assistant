import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { checkCoatingThickness } from "@/lib/tools/coating-thickness";
import { compareStandards } from "@/lib/tools/coating-thickness/compare";
import { estimateLife } from "@/lib/tools/durability";
import { screenReactivity } from "@/lib/tools/steel-reactivity";

// Setiap tool menerima `unknown` dan memvalidasi dirinya sendiri (Zod di
// dalam), sama seperti kontrak yang dipakai orchestrator chat nanti
// (lihat hdg-chat-guardrails/references/orchestrator.md: TOOL_IMPL[name](input)).
// Route ini murni dispatcher tipis -- tidak ada logika engineering di sini.
const handlers: Record<string, (raw: unknown) => unknown> = {
  check_coating_thickness: checkCoatingThickness,
  compare_thickness_standards: compareStandards,
  estimate_durability: estimateLife,
  screen_steel_reactivity: screenReactivity,
};

export async function POST(request: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const handler = handlers[name];
  if (!handler) {
    return NextResponse.json(
      { error: "unknown_tool", detail: `Tool "${name}" tidak dikenal.` },
      { status: 404 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    return NextResponse.json(handler(body));
  } catch (err) {
    if (err instanceof ZodError) {
      return NextResponse.json({ error: "invalid_input", detail: err.issues }, { status: 400 });
    }
    const message = err instanceof Error ? err.message : "Input di luar cakupan tool.";
    return NextResponse.json({ error: "out_of_scope", detail: message }, { status: 422 });
  }
}
