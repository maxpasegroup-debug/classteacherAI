-- Slim StudentProfile: targetRank text, drop training metadata columns

ALTER TABLE "StudentProfile" ADD COLUMN IF NOT EXISTS "targetRank_new" TEXT;
UPDATE "StudentProfile" SET "targetRank_new" = "targetRank"::text;
ALTER TABLE "StudentProfile" DROP COLUMN IF EXISTS "targetRank";
ALTER TABLE "StudentProfile" RENAME COLUMN "targetRank_new" TO "targetRank";
ALTER TABLE "StudentProfile" ALTER COLUMN "targetRank" SET NOT NULL;

ALTER TABLE "StudentProfile" DROP COLUMN IF EXISTS "trainingIntensity";
ALTER TABLE "StudentProfile" DROP COLUMN IF EXISTS "recommendedDailyQuestions";
ALTER TABLE "StudentProfile" DROP COLUMN IF EXISTS "weakAreaFocus";
ALTER TABLE "StudentProfile" DROP COLUMN IF EXISTS "difficultyStartLevel";
ALTER TABLE "StudentProfile" DROP COLUMN IF EXISTS "updatedAt";
