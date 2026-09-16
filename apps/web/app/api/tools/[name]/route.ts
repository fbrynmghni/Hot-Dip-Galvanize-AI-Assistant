import { NextResponse } from "next/server";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  return NextResponse.json(
    {
      error: "not_implemented",
      detail: `Kalkulator "${name}" belum dibangun — lihat skill hdg-engineering-tool.`,
    },
    { status: 501 },
  );
}
