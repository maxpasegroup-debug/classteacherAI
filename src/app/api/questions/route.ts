import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const questionCreateSchema = z.object({
  exam: z.string().min(1),
  subject: z.string().min(1),
  topic: z.string().min(1),
  subtopic: z.string().default(""),
  difficulty: z.string().min(1),
  type: z.string().min(1),
  questionText: z.string().min(1),
  options: z.array(z.string().min(1)).min(2),
  correctAnswer: z.string().min(1),
  explanation: z.string().min(1),
  expectedTime: z.number().int().min(15).max(600),
  marks: z.number().int().min(1).max(10),
  negativeMarks: z.number().int().min(0).max(10),
});

function requireAdminSecret(request: Request): boolean {
  const secret = process.env.QUESTIONS_ADMIN_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("x-admin-secret");
  return header === secret;
}

/** Admin seed / bulk import */
export async function POST(request: Request) {
  if (!requireAdminSecret(request)) {
    return NextResponse.json({ success: false, message: "Forbidden." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsedList = z.array(questionCreateSchema).safeParse(body?.questions);
  const parsedOne = questionCreateSchema.safeParse(body);

  const items = parsedList.success ? parsedList.data : parsedOne.success ? [parsedOne.data] : null;
  if (!items || items.length === 0) {
    return NextResponse.json(
      { success: false, message: "Send a question object or { questions: [...] }." },
      { status: 400 },
    );
  }

  const created = await prisma.$transaction(
    items.map((row) =>
      prisma.question.create({
        data: {
          exam: row.exam.trim(),
          subject: row.subject.trim(),
          topic: row.topic.trim(),
          subtopic: row.subtopic.trim(),
          difficulty: row.difficulty.trim().toUpperCase(),
          type: row.type.trim().toUpperCase(),
          questionText: row.questionText.trim(),
          options: row.options,
          correctAnswer: row.correctAnswer.trim(),
          explanation: row.explanation.trim(),
          expectedTime: row.expectedTime,
          marks: row.marks,
          negativeMarks: row.negativeMarks,
        },
        select: { id: true },
      }),
    ),
  );

  return NextResponse.json({ success: true, count: created.length, ids: created.map((c) => c.id) });
}

/** Filterable listing (authenticated) */
export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ success: false, message: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const exam = searchParams.get("exam")?.trim();
  const subject = searchParams.get("subject")?.trim();
  const topic = searchParams.get("topic")?.trim();
  const difficulty = searchParams.get("difficulty")?.trim();
  const take = Math.min(200, Math.max(1, Number(searchParams.get("take") ?? "50") || 50));

  const where: Record<string, unknown> = {};
  if (exam) where.exam = exam;
  if (subject) where.subject = subject;
  if (topic) where.topic = { contains: topic, mode: "insensitive" };
  if (difficulty) where.difficulty = difficulty.toUpperCase();

  const rows = await prisma.question.findMany({
    where,
    take,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      exam: true,
      subject: true,
      topic: true,
      subtopic: true,
      difficulty: true,
      type: true,
      questionText: true,
      options: true,
      expectedTime: true,
      marks: true,
      negativeMarks: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    success: true,
    questions: rows.map((q) => ({
      ...q,
      options: Array.isArray(q.options) ? q.options.filter((x): x is string => typeof x === "string") : [],
    })),
  });
}
