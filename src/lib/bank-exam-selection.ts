import type { Question } from "@prisma/client";
import { shuffle } from "@/lib/top10-training-engine";

const DIFF_BUCKETS = ["EASY", "MEDIUM", "HARD", "RANK"] as const;

export function inferExamTrackFromTitle(title: string): string {
  const t = title.toUpperCase();
  if (t.includes("JEE")) return "JEE";
  if (t.includes("NEET")) return "NEET";
  return "NEET";
}

export function parseQuestionOptions(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === "string");
}

/**
 * Picks a unique random set with balanced difficulty (EASY / MEDIUM / HARD / RANK).
 */
export function pickBalancedQuestionSet(pool: Question[], targetCount: number): Question[] {
  if (pool.length === 0) return [];
  const n = Math.min(Math.max(10, targetCount), 20, pool.length);
  const perBucket = Math.max(1, Math.floor(n / DIFF_BUCKETS.length));
  const buckets = new Map<string, Question[]>();
  for (const d of DIFF_BUCKETS) buckets.set(d, []);
  const unclassified: Question[] = [];
  for (const q of pool) {
    const key = q.difficulty.trim().toUpperCase();
    if (buckets.has(key)) {
      buckets.get(key)!.push(q);
    } else {
      unclassified.push(q);
    }
  }
  const used = new Set<string>();
  const out: Question[] = [];
  for (const d of DIFF_BUCKETS) {
    const shuffled = shuffle([...(buckets.get(d) ?? [])]);
    for (const q of shuffled.slice(0, perBucket)) {
      if (!used.has(q.id)) {
        used.add(q.id);
        out.push(q);
      }
    }
  }
  if (out.length < n) {
    const rest = shuffle([...unclassified, ...pool.filter((q) => !used.has(q.id))]);
    for (const q of rest) {
      if (out.length >= n) break;
      if (!used.has(q.id)) {
        used.add(q.id);
        out.push(q);
      }
    }
  }
  return shuffle(out).slice(0, n);
}

export function totalExpectedSeconds(questions: Question[], bufferRatio = 1.35): number {
  const raw = questions.reduce((s, q) => s + Math.max(30, q.expectedTime), 0);
  return Math.min(3600, Math.max(480, Math.ceil(raw * bufferRatio)));
}
