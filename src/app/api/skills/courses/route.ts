import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  const courses = await prisma.course.findMany({
    include: { lessons: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return NextResponse.json({ courses });
}
