import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || session.activeRole !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { studentId?: string } | null;
  if (!body?.studentId) {
    return NextResponse.json({ error: "studentId is required." }, { status: 400 });
  }

  const student = await prisma.user.findUnique({
    where: { id: body.studentId },
    select: { id: true, name: true, email: true, roles: true },
  });
  if (!student || !student.roles.includes("STUDENT")) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const records = await prisma.studentPerformance.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const avg = records.length ? records.reduce((a, b) => a + b.score, 0) / records.length : 0;
  const weakAreas = [...new Set(records.flatMap((item) => item.weakAreas))].slice(0, 8);

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText("ClassteacherAI - AI Report Card", { x: 50, y: 790, size: 20, font, color: rgb(0.1, 0.1, 0.2) });
  page.drawText(`Student: ${student.name}`, { x: 50, y: 755, size: 12, font });
  page.drawText(`Email: ${student.email}`, { x: 50, y: 738, size: 12, font });
  page.drawText(`Average Score: ${avg.toFixed(2)}%`, { x: 50, y: 710, size: 12, font });
  page.drawText(`Weak Areas: ${weakAreas.join(", ") || "None identified"}`, { x: 50, y: 690, size: 12, font });
  page.drawText(
    "AI Summary: Student shows consistent potential. Focus on weak areas with targeted practice and weekly mock tests.",
    { x: 50, y: 660, size: 11, font, maxWidth: 500, lineHeight: 14 },
  );

  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=\"report-card-${student.name.replace(/\s+/g, "-")}.pdf\"`,
    },
  });
}
