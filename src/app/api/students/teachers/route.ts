import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const subject = searchParams.get("subject")?.toLowerCase();

  const profiles = await prisma.teacherProfile.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { avgRating: "desc" },
    take: 50,
  });

  const filtered = subject
    ? profiles.filter((item) => item.subjects.some((s) => s.toLowerCase().includes(subject)))
    : profiles;

  return NextResponse.json({ teachers: filtered });
}
