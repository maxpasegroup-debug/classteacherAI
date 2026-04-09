import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ notifications });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  const body = (await request.json().catch(() => null)) as { title?: string; message?: string } | null;
  if (!body?.title || !body.message) return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  const created = await prisma.notification.create({
    data: { userId: session.userId, title: body.title, message: body.message },
  });
  return NextResponse.json({ ok: true, notification: created });
}
