CREATE TABLE "TrainingState" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'Average',
    "intensity" TEXT NOT NULL DEFAULT 'Medium',
    "weakTopics" JSONB NOT NULL DEFAULT '[]',
    "strongTopics" JSONB NOT NULL DEFAULT '[]',
    "lastScore" INTEGER,
    "lastAccuracy" DOUBLE PRECISION,
    "lastExam" TEXT,
    "lastSubject" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrainingState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TrainingState_userId_key" ON "TrainingState"("userId");

ALTER TABLE "TrainingState" ADD CONSTRAINT "TrainingState_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
