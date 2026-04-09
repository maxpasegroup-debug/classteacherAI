import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, service: "classteacherai", db: "up" });
  } catch {
    return NextResponse.json({ ok: false, service: "classteacherai", db: "down" }, { status: 503 });
  }
}
