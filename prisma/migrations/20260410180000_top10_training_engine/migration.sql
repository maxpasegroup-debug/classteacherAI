-- TOP10 Rank Training Engine: attempt flags + per-user training state
ALTER TABLE "ExamAttempt" ADD COLUMN IF NOT EXISTS "trainingMode" TEXT;
ALTER TABLE "ExamAttempt" ADD COLUMN IF NOT EXISTS "surpriseReal" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ExamAttempt" ADD COLUMN IF NOT EXISTS "dailyChallenge" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ExamAttempt" ADD COLUMN IF NOT EXISTS "allowedSeconds" INTEGER;

CREATE TABLE IF NOT EXISTS "Top10TrainingState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'IDLE',
    "difficulty" INTEGER NOT NULL DEFAULT 2,
    "weakTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "circuitCount" INTEGER NOT NULL DEFAULT 0,
    "streakPasses" INTEGER NOT NULL DEFAULT 0,
    "lastAttemptId" TEXT,
    "lastExamId" TEXT,
    "pendingRetry" BOOLEAN NOT NULL DEFAULT false,
    "lastWrongQuestionIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lastAccuracyPct" DOUBLE PRECISION,
    "dailyChallengeDate" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Top10TrainingState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "Top10TrainingState_userId_key" ON "Top10TrainingState"("userId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Top10TrainingState_userId_fkey'
  ) THEN
    ALTER TABLE "Top10TrainingState" ADD CONSTRAINT "Top10TrainingState_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
