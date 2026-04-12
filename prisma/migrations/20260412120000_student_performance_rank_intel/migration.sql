-- Rank intelligence fields on StudentPerformance (extends legacy subject/score/weakAreas rows).
ALTER TABLE "StudentPerformance" ADD COLUMN IF NOT EXISTS "examId" TEXT;
ALTER TABLE "StudentPerformance" ADD COLUMN IF NOT EXISTS "attemptId" TEXT;
ALTER TABLE "StudentPerformance" ADD COLUMN IF NOT EXISTS "accuracy" DOUBLE PRECISION;
ALTER TABLE "StudentPerformance" ADD COLUMN IF NOT EXISTS "timeTaken" INTEGER;
ALTER TABLE "StudentPerformance" ADD COLUMN IF NOT EXISTS "rank" INTEGER;
ALTER TABLE "StudentPerformance" ADD COLUMN IF NOT EXISTS "percentile" DOUBLE PRECISION;
ALTER TABLE "StudentPerformance" ADD COLUMN IF NOT EXISTS "analysis" JSONB NOT NULL DEFAULT '{}';

CREATE UNIQUE INDEX IF NOT EXISTS "StudentPerformance_attemptId_key" ON "StudentPerformance"("attemptId");
CREATE INDEX IF NOT EXISTS "StudentPerformance_examId_createdAt_idx" ON "StudentPerformance"("examId", "createdAt");
