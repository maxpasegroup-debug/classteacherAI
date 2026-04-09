CREATE TABLE IF NOT EXISTS "NexaStudentMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weakTopics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "rankReadiness" INTEGER NOT NULL DEFAULT 50,
    "examCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccuracyPct" DOUBLE PRECISION,
    "lastExamAt" TIMESTAMP(3),
    "history" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NexaStudentMemory_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "NexaStudentMemory_userId_key" ON "NexaStudentMemory"("userId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'NexaStudentMemory_userId_fkey') THEN
    ALTER TABLE "NexaStudentMemory" ADD CONSTRAINT "NexaStudentMemory_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
