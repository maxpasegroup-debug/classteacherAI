import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";

export const runtime = "nodejs";

const byMode: Record<
  string,
  Record<string, string[]>
> = {
  STUDENT: {
    DOUBT_SOLVING: [
      "Explain why photosynthesis needs chlorophyll.",
      "I keep getting this algebra step wrong—walk me through it.",
      "What is the difference between speed and velocity?",
    ],
    CONCEPT_TEACHING: [
      "Teach me trigonometry basics from zero.",
      "Explain Newton's laws with everyday examples.",
      "How does the water cycle work step by step?",
    ],
    EXAM_TIPS: [
      "How should I revise one week before boards?",
      "Give me a 30-minute practice plan for MCQs.",
      "How do I manage time during a 3-hour exam?",
    ],
    NOTES_GENERATION: [
      "Summarize chapter 5 as bullet notes.",
      "Create flashcards for key formulas in this unit.",
      "Give me a one-page revision sheet for this topic.",
    ],
  },
  TEACHER: {
    LESSON_PLANNING: [
      "45-minute lesson plan for fractions with activities.",
      "Differentiation strategies for mixed-ability class.",
      "Exit ticket ideas for today's objective.",
    ],
    CONTENT_CREATION: [
      "Worksheet: 10 practice problems with answer key.",
      "Short story-based word problems for grade 8.",
      "Rubric for a group presentation on climate.",
    ],
    NOTES_GENERATION: [
      "Teacher guide: key points to emphasize in this chapter.",
      "Parent email template for homework expectations.",
      "Slide outline for parent–teacher meeting.",
    ],
  },
};

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") === "TEACHER" ? "TEACHER" : "STUDENT";
  const capability = searchParams.get("capability") ?? "DOUBT_SOLVING";

  const list = byMode[mode]?.[capability] ?? byMode[mode]?.DOUBT_SOLVING ?? byMode.STUDENT.DOUBT_SOLVING;

  return NextResponse.json({ suggestions: list });
}
