import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { studentId?: string } | null;
  if (!body?.studentId) {
    return NextResponse.json({ error: "studentId is required." }, { status: 400 });
  }

  const student = await prisma.user.findUnique({
    where: { id: body.studentId },
    select: { id: true, name: true, email: true },
  });
  if (!student) {
    return NextResponse.json({ error: "Student not found." }, { status: 404 });
  }

  const records = await prisma.studentPerformance.findMany({
    where: { studentId: student.id },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  const avg = records.length ? records.reduce((a, b) => a + b.score, 0) / records.length : 0;
  const weakAreas = [...new Set(records.flatMap((item) => item.weakAreas))].slice(0, 8);

  const summary =
    records.length === 0
      ? "No performance snapshots on file yet. Log exam or practice results to populate trends."
      : `Based on ${records.length} recent snapshot(s): average ${avg.toFixed(1)}%. ${
          weakAreas.length > 0
            ? `Flagged focus areas: ${weakAreas.join(", ")}. Recommend targeted drills before the next assessment.`
            : "No weak-area flags in the latest snapshots."
        }`;

  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  page.drawText("ClassteacherAI - Report card", { x: 50, y: 790, size: 20, font, color: rgb(0.1, 0.1, 0.2) });
  page.drawText(`Student: ${student.name}`, { x: 50, y: 755, size: 12, font });
  page.drawText(`Email: ${student.email}`, { x: 50, y: 738, size: 12, font });
  page.drawText(`Average score: ${avg.toFixed(2)}%`, { x: 50, y: 710, size: 12, font });
  page.drawText(`Weak areas: ${weakAreas.join(", ") || "None identified"}`, { x: 50, y: 690, size: 12, font });
  page.drawText(summary, { x: 50, y: 660, size: 11, font, maxWidth: 500, lineHeight: 14 });

  const bytes = await pdf.save();
  return new Response(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=\"report-card-${student.name.replace(/\s+/g, "-")}.pdf\"`,
    },
  });
}
