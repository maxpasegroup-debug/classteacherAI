DO $$
BEGIN
  -- Add new roles[] column if this database is still on legacy schema.
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'roles'
  ) THEN
    ALTER TABLE "User"
      ADD COLUMN "roles" "UserRole"[] NOT NULL DEFAULT ARRAY[]::"UserRole"[];
  END IF;

  -- Backfill roles[] from legacy role column when present.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'role'
  ) THEN
    UPDATE "User"
    SET "roles" = ARRAY["role"]::"UserRole"[]
    WHERE cardinality("roles") = 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'StudentProfile'
  ) THEN
    CREATE TABLE "StudentProfile" (
      "id" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "exam" TEXT NOT NULL,
      "targetRank" INTEGER NOT NULL,
      "level" TEXT NOT NULL,
      "studyHours" INTEGER NOT NULL,
      "weakness" TEXT NOT NULL,
      "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
      "trainingIntensity" TEXT NOT NULL,
      "recommendedDailyQuestions" INTEGER NOT NULL,
      "weakAreaFocus" TEXT NOT NULL,
      "difficultyStartLevel" INTEGER NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "StudentProfile_pkey" PRIMARY KEY ("id")
    );

    CREATE UNIQUE INDEX "StudentProfile_userId_key" ON "StudentProfile"("userId");
    CREATE INDEX "StudentProfile_exam_idx" ON "StudentProfile"("exam");
    ALTER TABLE "StudentProfile"
      ADD CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId")
      REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
