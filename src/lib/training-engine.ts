import type { Attempt, Prisma, Question, TrainingState } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { parseQuestionOptions, pickBalancedQuestionSet, totalExpectedSeconds } from "@/lib/bank-exam-selection";
import { shuffle } from "@/lib/top10-training-engine";
import { isTopRankPlan } from "@/lib/plan-tier";

export type TopicWeight = { topic: string; w: number; slow?: boolean };

export type FocusPayload = { active: boolean; topic?: string; reason?: string };

export type WeakTopicsJson = { topics: TopicWeight[]; version?: number; focus?: FocusPayload };
export type StrongTopicsJson = { topics: TopicWeight[]; version?: number };

function parseWeak(raw: unknown): WeakTopicsJson {
  if (!raw || typeof raw !== "object") return { topics: [] };
  const o = raw as Record<string, unknown>;
  let focus: FocusPayload | undefined;
  const fr = o.focus;
  if (fr && typeof fr === "object") {
    const f = fr as Record<string, unknown>;
    if (typeof f.active === "boolean") {
      focus = {
        active: f.active,
        topic: typeof f.topic === "string" ? f.topic : undefined,
        reason: typeof f.reason === "string" ? f.reason : undefined,
      };
    }
  }
  if (Array.isArray(o.topics)) {
    return {
      topics: o.topics
        .map((t) => {
          if (!t || typeof t !== "object") return null;
          const x = t as Record<string, unknown>;
          const topic = typeof x.topic === "string" ? x.topic : "";
          const w = typeof x.w === "number" ? x.w : typeof x.mistakes === "number" ? x.mistakes : 0;
          if (!topic) return null;
          return { topic, w, slow: Boolean(x.slow) } as TopicWeight;
        })
        .filter((x): x is TopicWeight => x !== null),
      focus,
    };
  }
  return { topics: [], focus };
}

function parseStrong(raw: unknown): StrongTopicsJson {
  if (!raw || typeof raw !== "object") return { topics: [] };
  const o = raw as Record<string, unknown>;
  if (Array.isArray(o.topics)) {
    return {
      topics: o.topics
        .map((t) => {
          if (!t || typeof t !== "object") return null;
          const x = t as Record<string, unknown>;
          const topic = typeof x.topic === "string" ? x.topic : "";
          const w = typeof x.w === "number" ? x.w : typeof x.streak === "number" ? x.streak : 0;
          if (!topic) return null;
          return { topic, w } as TopicWeight;
        })
        .filter((x): x is TopicWeight => x !== null),
    };
  }
  return { topics: [] };
}

function mergeTopicWeights(existing: TopicWeight[], deltas: Map<string, number>, cap: number): TopicWeight[] {
  const map = new Map<string, TopicWeight>();
  for (const t of existing) {
    map.set(t.topic, { ...t });
  }
  for (const [topic, inc] of deltas) {
    const cur = map.get(topic) ?? { topic, w: 0 };
    cur.w = Math.max(0, cur.w + inc);
    map.set(topic, cur);
  }
  return [...map.values()]
    .filter((t) => t.w > 0)
    .sort((a, b) => b.w - a.w)
    .slice(0, cap);
}

const LEVELS = ["Beginner", "Average", "Advanced"] as const;
const INTENSITIES = ["Low", "Medium", "High"] as const;

export function progressLevelIntensity(level: string, intensity: string, accuracyPct: number): { level: string; intensity: string } {
  const L = level.trim();
  const I = intensity.trim();
  let li = LEVELS.indexOf(L as (typeof LEVELS)[number]);
  let ii = INTENSITIES.indexOf(I as (typeof INTENSITIES)[number]);
  if (li < 0) li = 1;
  if (ii < 0) ii = 1;

  if (accuracyPct > 80) {
    if (ii < 2) ii += 1;
    else if (li < 2) {
      li += 1;
      ii = 0;
    }
  } else if (accuracyPct < 50) {
    if (ii > 0) ii -= 1;
    else if (li > 0) {
      li -= 1;
      ii = 2;
    }
  }

  return { level: LEVELS[li] ?? "Average", intensity: INTENSITIES[ii] ?? "Medium" };
}

function difficultiesForProfile(level: string, intensity: string): string[] {
  const L = level.toLowerCase();
  const I = intensity.toLowerCase();
  if (L.includes("beginner") || I.includes("low")) return ["EASY", "MEDIUM"];
  if (L.includes("advanced") && I.includes("high")) return ["HARD", "RANK", "MEDIUM"];
  if (L.includes("advanced") || I.includes("high")) return ["MEDIUM", "HARD", "RANK"];
  return ["EASY", "MEDIUM", "HARD"];
}

function median(nums: number[]): number {
  if (nums.length === 0) return 60;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2;
}

export type AttemptReviewRow = {
  questionId: string;
  isCorrect: boolean;
};

/**
 * Updates TrainingState from a completed bank attempt (topic stats + difficulty progression).
 */
export async function analyzeAndUpsertTrainingState(input: {
  userId: string;
  plan: string;
  accuracyPct: number;
  score: number;
  exam: string;
  subject: string;
  reviewRows: AttemptReviewRow[];
  questions: Question[];
}): Promise<TrainingState> {
  const qMap = new Map(input.questions.map((q) => [q.id, q]));
  const wrongByTopic = new Map<string, number>();
  const correctByTopic = new Map<string, number>();
  const wrongTimes: number[] = [];

  for (const row of input.reviewRows) {
    const q = qMap.get(row.questionId);
    if (!q) continue;
    if (row.isCorrect) {
      correctByTopic.set(q.topic, (correctByTopic.get(q.topic) ?? 0) + 1);
    } else {
      wrongByTopic.set(q.topic, (wrongByTopic.get(q.topic) ?? 0) + 1);
      wrongTimes.push(q.expectedTime);
    }
  }

  const medWrongTime = median(wrongTimes);
  const slowTopics = new Set<string>();
  for (const row of input.reviewRows) {
    if (row.isCorrect) continue;
    const q = qMap.get(row.questionId);
    if (!q) continue;
    if (q.expectedTime >= medWrongTime * 1.15 && medWrongTime > 0) {
      slowTopics.add(q.topic);
    }
  }

  const existing = await prisma.trainingState.findUnique({ where: { userId: input.userId } });
  const profile = await prisma.studentProfile.findUnique({
    where: { userId: input.userId },
    select: { level: true },
  });

  const baseLevel = existing?.level ?? profile?.level ?? "Average";
  const baseIntensity = existing?.intensity ?? "Medium";
  const { level, intensity } = progressLevelIntensity(baseLevel, baseIntensity, input.accuracyPct);

  const weakPrev = parseWeak(existing?.weakTopics ?? []);
  const strongPrev = parseStrong(existing?.strongTopics ?? []);

  const weakDelta = new Map<string, number>();
  for (const [t, n] of wrongByTopic) weakDelta.set(t, n * (isTopRankPlan(input.plan) ? 2 : 1));
  for (const t of slowTopics) weakDelta.set(t, (weakDelta.get(t) ?? 0) + 0.5);

  const strongDelta = new Map<string, number>();
  for (const [t, n] of correctByTopic) strongDelta.set(t, n);

  const mergedWeakTopics = mergeTopicWeights(weakPrev.topics, weakDelta, 12).map((x) => ({
    ...x,
    slow: slowTopics.has(x.topic) || x.slow,
  }));

  const top = mergedWeakTopics[0];
  const prevFocus = weakPrev.focus;
  let wrongOnFocusedTopic = 0;
  if (prevFocus?.active && prevFocus.topic) {
    wrongOnFocusedTopic = wrongByTopic.get(prevFocus.topic) ?? 0;
  }

  let focus: FocusPayload | undefined;
  if (prevFocus?.active && prevFocus.topic && input.accuracyPct >= 72 && wrongOnFocusedTopic <= 1) {
    focus = { active: false, topic: prevFocus.topic, reason: "Focus Mode cleared — accuracy held on this topic." };
  } else if (top && top.w >= 5) {
    focus = {
      active: true,
      topic: top.topic,
      reason: "Focus Mode: error weight crossed threshold — drill this topic until stable.",
    };
  } else if (prevFocus?.active && top && prevFocus.topic === top.topic && top.w >= 3) {
    focus = {
      active: true,
      topic: top.topic,
      reason: "Focus Mode: topic still dominates your weak set.",
    };
  } else if (top && top.w >= 4 && (!prevFocus?.active || prevFocus.topic !== top.topic)) {
    focus = { active: true, topic: top.topic, reason: "Focus Mode: new leak — isolate and repeat." };
  } else {
    focus = { active: false };
  }

  const weakTopics: WeakTopicsJson = {
    version: 1,
    topics: mergedWeakTopics,
    focus,
  };

  const strongTopics: StrongTopicsJson = {
    version: 1,
    topics: mergeTopicWeights(strongPrev.topics, strongDelta, 8),
  };

  return prisma.trainingState.upsert({
    where: { userId: input.userId },
    create: {
      userId: input.userId,
      level,
      intensity,
      weakTopics: weakTopics as unknown as Prisma.InputJsonValue,
      strongTopics: strongTopics as unknown as Prisma.InputJsonValue,
      lastScore: input.score,
      lastAccuracy: input.accuracyPct,
      lastExam: input.exam,
      lastSubject: input.subject,
    },
    update: {
      level,
      intensity,
      weakTopics: weakTopics as unknown as Prisma.InputJsonValue,
      strongTopics: strongTopics as unknown as Prisma.InputJsonValue,
      lastScore: input.score,
      lastAccuracy: input.accuracyPct,
      lastExam: input.exam,
      lastSubject: input.subject,
    },
  });
}

function takeUniqueQuestions(pool: Question[], count: number, exclude: Set<string>): Question[] {
  const sh = shuffle([...pool].filter((q) => !exclude.has(q.id)));
  const out: Question[] = [];
  for (const q of sh) {
    if (out.length >= count) break;
    if (exclude.has(q.id)) continue;
    exclude.add(q.id);
    out.push(q);
  }
  return out;
}

/**
 * Builds next loop question set: ~60% weak topics, ~30% mixed, ~10% strong topics.
 */
export function pickLoopQuestionMix(params: {
  pool: Question[];
  weakTopicNames: string[];
  strongTopicNames: string[];
  total: number;
}): Question[] {
  const { pool, weakTopicNames, strongTopicNames, total } = params;
  const weakSet = new Set(weakTopicNames.map((t) => t.toLowerCase()));
  const strongSet = new Set(strongTopicNames.map((t) => t.toLowerCase()));

  const weakPool = pool.filter((q) => weakSet.has(q.topic.toLowerCase()));
  const strongPool = pool.filter((q) => strongSet.has(q.topic.toLowerCase()));
  const neutralPool = pool.filter(
    (q) => !weakSet.has(q.topic.toLowerCase()) && !strongSet.has(q.topic.toLowerCase()),
  );

  const nStrong = Math.max(1, Math.min(total - 2, Math.round(total * 0.1)));
  const nWeak = Math.max(1, Math.min(total - nStrong - 1, Math.round(total * 0.6)));
  const nNeutral = Math.max(1, total - nWeak - nStrong);

  const used = new Set<string>();
  const out: Question[] = [];

  out.push(...takeUniqueQuestions(weakPool.length > 0 ? weakPool : pool, nWeak, used));
  out.push(...takeUniqueQuestions(neutralPool.length > 0 ? neutralPool : pool, nNeutral, used));
  out.push(...takeUniqueQuestions(strongPool.length > 0 ? strongPool : pool, nStrong, used));

  if (out.length < total) {
    out.push(...takeUniqueQuestions(pool, total - out.length, used));
  }

  return shuffle(out).slice(0, Math.min(total, pool.length));
}

export async function createLoopBankAttempt(input: {
  userId: string;
  plan: string;
  exam: string;
  subject: string;
  state: TrainingState;
}): Promise<{
  attempt: Attempt;
  questions: Question[];
  examRow: { id: string; title: string; subject: string; durationMin: number; type: "MOCK" | "PRACTICE" };
  deadlineAt: string;
  durationSec: number;
  mixMeta: {
    weakPicked: number;
    neutralPicked: number;
    strongPicked: number;
    focusMode: boolean;
    focusTopic?: string;
  };
}> {
  const weak = parseWeak(input.state.weakTopics);
  const strong = parseStrong(input.state.strongTopics);
  const weakNames = weak.topics.map((t) => t.topic);
  const strongNames = strong.topics.map((t) => t.topic);

  const allowedDiffs = difficultiesForProfile(input.state.level, input.state.intensity);
  const baseTotal = isTopRankPlan(input.plan) ? 18 : 14;
  const total = Math.min(20, Math.max(10, baseTotal));

  const pool = await prisma.question.findMany({
    where: {
      exam: input.exam,
      subject: input.subject,
      difficulty: { in: allowedDiffs },
    },
    take: 220,
    orderBy: { createdAt: "desc" },
  });

  if (pool.length < 5) {
    throw new Error("NOT_ENOUGH_QUESTIONS");
  }

  let selected: Question[];
  const focusTopic = weak.focus?.active && weak.focus.topic ? weak.focus.topic.trim() : "";
  if (focusTopic) {
    const ft = focusTopic.toLowerCase();
    let focusPool = pool.filter((q) => q.topic.toLowerCase() === ft);
    if (focusPool.length < Math.min(8, total)) {
      focusPool = pool.filter(
        (q) => q.topic.toLowerCase().includes(ft) || q.subtopic.toLowerCase().includes(ft),
      );
    }
    if (focusPool.length < 5) {
      focusPool = pool.filter((q) => weakNames.some((w) => w.toLowerCase() === q.topic.toLowerCase()));
    }
    if (focusPool.length < 5) {
      focusPool = [...pool];
    }
    const used = new Set<string>();
    selected = takeUniqueQuestions(focusPool, total, used);
    if (selected.length < total) {
      selected.push(...takeUniqueQuestions(pool, total - selected.length, used));
    }
    selected = shuffle(selected).slice(0, Math.min(total, selected.length));
  } else {
    selected =
      weakNames.length >= 2
        ? pickLoopQuestionMix({ pool, weakTopicNames: weakNames, strongTopicNames: strongNames, total })
        : pickBalancedQuestionSet(pool, total);

    if (selected.length < Math.min(8, total)) {
      selected = pickBalancedQuestionSet(pool, total);
    }
  }

  const maxMarks = selected.reduce((s, q) => s + q.marks, 0);
  let durationSec = totalExpectedSeconds(selected, isTopRankPlan(input.plan) ? 1.15 : 1.35);
  if (isTopRankPlan(input.plan)) {
    durationSec = Math.max(420, Math.floor(durationSec * 0.92));
  }

  const attempt = await prisma.attempt.create({
    data: {
      userId: input.userId,
      exam: input.exam,
      subject: input.subject,
      mode: "training_loop",
      questionIds: selected.map((q) => q.id),
      total: maxMarks,
      allowedSeconds: durationSec,
    },
  });

  const catalogExam = await prisma.exam.findFirst({
    where: { subject: input.subject },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, subject: true, durationMin: true, type: true },
  });

  const examRow = catalogExam ?? {
    id: `loop:${input.exam}:${input.subject}`,
    title: `TopRank loop · ${input.exam} ${input.subject}`,
    subject: input.subject,
    durationMin: Math.ceil(durationSec / 60),
    type: "MOCK" as const,
  };

  const deadlineAt = new Date(attempt.createdAt.getTime() + durationSec * 1000).toISOString();

  const weakSet = new Set(weakNames.map((t) => t.toLowerCase()));
  const strongSet = new Set(strongNames.map((t) => t.toLowerCase()));
  const ftLower = focusTopic.toLowerCase();
  let wC = 0;
  let sC = 0;
  let nC = 0;
  if (focusTopic) {
    wC = selected.filter((q) => q.topic.toLowerCase() === ftLower).length;
    nC = selected.length - wC;
  } else {
    for (const q of selected) {
      const tl = q.topic.toLowerCase();
      if (weakSet.has(tl)) wC += 1;
      else if (strongSet.has(tl)) sC += 1;
      else nC += 1;
    }
  }

  return {
    attempt,
    questions: selected,
    examRow: {
      id: examRow.id,
      title: examRow.title,
      subject: examRow.subject,
      durationMin: examRow.durationMin,
      type: examRow.type === "PRACTICE" ? "PRACTICE" : "MOCK",
    },
    deadlineAt,
    durationSec,
    mixMeta: {
      weakPicked: wC,
      neutralPicked: nC,
      strongPicked: sC,
      focusMode: Boolean(focusTopic),
      focusTopic: focusTopic || undefined,
    },
  };
}

export function trainingStateSummary(state: TrainingState) {
  const w = parseWeak(state.weakTopics);
  const s = parseStrong(state.strongTopics);
  return {
    level: state.level,
    intensity: state.intensity,
    topWeak: w.topics.slice(0, 5).map((t) => t.topic),
    topStrong: s.topics.slice(0, 4).map((t) => t.topic),
    lastAccuracy: state.lastAccuracy,
    lastScore: state.lastScore,
    focusMode: Boolean(w.focus?.active),
    focusTopic: w.focus?.active ? w.focus.topic : undefined,
    focusReason: w.focus?.active ? w.focus.reason : undefined,
  };
}

/** Rule-based daily directive (no AI spend). */
export function buildDailyTrainingTask(input: {
  plan: string;
  exam: string;
  subject: string;
  topWeak: string[];
  focusMode: boolean;
  focusTopic?: string;
}): { task: string; continuousPush: string } {
  const topRank = isTopRankPlan(input.plan);
  const nQ = topRank ? 40 : 25;
  const primary = input.topWeak[0] ?? input.focusTopic ?? "your weakest chapter";
  const topicLine =
    input.focusMode && input.focusTopic
      ? `${nQ} ${input.subject} questions — Focus Mode on "${input.focusTopic}" only, then 1 full timed test.`
      : `${nQ} ${input.subject} questions weighted to ${primary} + 1 timed ${input.exam}-style test.`;

  const task = `Today: ${topicLine}`;
  const continuousPush = topRank
    ? "No idle state: after every session, run Start training or Fix weak areas — same day, no drift."
    : "After you close this test, either hit Fix weak areas or Start training — keep the chain unbroken.";

  return { task, continuousPush };
}
