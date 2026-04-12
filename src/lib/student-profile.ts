/** First integer in the string, or a safe default for analytics. */
export function parseTargetRankNumber(targetRank: string): number {
  const m = targetRank.trim().match(/\d+/);
  if (!m) return 10_000;
  return Math.max(1, parseInt(m[0], 10));
}

type StudentInputs = {
  targetRank: number;
  level: string;
  studyHours: number;
  weakness: string;
};

type StudentProfileGenerated = {
  trainingIntensity: string;
  recommendedDailyQuestions: number;
  weakAreaFocus: string;
  difficultyStartLevel: number;
};

export function buildStudentRankProfile(input: StudentInputs): StudentProfileGenerated {
  const level = input.level.toLowerCase();
  const weakness = input.weakness.trim();

  const isTop100 = input.targetRank <= 100;
  const isTop500 = input.targetRank <= 500;
  const highHours = input.studyHours >= 6;
  const mediumHours = input.studyHours >= 4;

  const trainingIntensity = isTop100 || highHours ? "High Intensity" : isTop500 || mediumHours ? "Focused Intensity" : "Steady Intensity";

  let baseQuestions = 30;
  if (isTop100) baseQuestions = 80;
  else if (isTop500) baseQuestions = 60;
  else if (input.targetRank <= 2000) baseQuestions = 45;

  if (level === "beginner") baseQuestions = Math.max(25, baseQuestions - 10);
  if (level === "advanced") baseQuestions += 10;
  if (highHours) baseQuestions += 10;

  let difficultyStartLevel = 2;
  if (level === "beginner") difficultyStartLevel = 1;
  if (level === "advanced") difficultyStartLevel = 3;

  return {
    trainingIntensity,
    recommendedDailyQuestions: Math.min(120, Math.max(20, baseQuestions)),
    weakAreaFocus: weakness,
    difficultyStartLevel,
  };
}
