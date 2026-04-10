/** Build practice/advance exam question sets: topic focus, mixed difficulty, shuffle. */

import { shuffle } from "@/lib/top10-training-engine";

export type QuestionPick = {
  id: string;
  level: string;
  question: string;
};

function bucketLevel(level: string): "easy" | "mid" | "hard" {
  const L = level.toLowerCase().trim();
  const n = parseInt(L, 10);
  if (!Number.isNaN(n)) {
    if (n <= 2) return "easy";
    if (n <= 3) return "mid";
    return "hard";
  }
  if (/easy|beginner|basic|low/.test(L)) return "easy";
  if (/hard|adv|difficult|high/.test(L)) return "hard";
  return "mid";
}

/**
 * Mix easy / mid / hard from pool up to target count.
 */
export function pickMixedDifficultyQuestions(pool: QuestionPick[], target: number): QuestionPick[] {
  if (pool.length === 0) return [];
  const buckets = { easy: [] as QuestionPick[], mid: [] as QuestionPick[], hard: [] as QuestionPick[] };
  for (const q of pool) {
    buckets[bucketLevel(q.level)].push(q);
  }
  const e = shuffle(buckets.easy);
  const m = shuffle(buckets.mid);
  const h = shuffle(buckets.hard);
  const per = Math.max(1, Math.ceil(target / 3));
  const out: QuestionPick[] = [];
  out.push(...e.slice(0, per), ...m.slice(0, per), ...h.slice(0, per));
  if (out.length < target) {
    const used = new Set(out.map((q) => q.id));
    const rest = shuffle(pool.filter((q) => !used.has(q.id)));
    out.push(...rest.slice(0, target - out.length));
  }
  return out.slice(0, target);
}
