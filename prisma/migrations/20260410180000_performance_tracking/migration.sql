-- CreateTable
CREATE TABLE "PerformanceAttemptMetric" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "accuracyPct" DOUBLE PRECISION NOT NULL,
    "timeSpentSec" INTEGER NOT NULL,
    "questionCount" INTEGER NOT NULL,
    "secondsPerQuestion" DOUBLE PRECISION NOT NULL,
    "wrongByTopic" JSONB NOT NULL DEFAULT '{}',
    "rankReadinessSnapshot" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceAttemptMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceTopicStat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicKey" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "answered" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceTopicStat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceDailySnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dayKey" TEXT NOT NULL,
    "avgAccuracy" DOUBLE PRECISION NOT NULL,
    "attemptCount" INTEGER NOT NULL,
    "avgSecondsPerQuestion" DOUBLE PRECISION NOT NULL,
    "consistencyScore" DOUBLE PRECISION,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceDailySnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceInsightRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "relatedSubject" TEXT,
    "relatedTopic" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceInsightRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceAttemptMetric_attemptId_key" ON "PerformanceAttemptMetric"("attemptId");

-- CreateIndex
CREATE INDEX "PerformanceAttemptMetric_userId_createdAt_idx" ON "PerformanceAttemptMetric"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "PerformanceAttemptMetric_userId_subject_idx" ON "PerformanceAttemptMetric"("userId", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceTopicStat_userId_topicKey_key" ON "PerformanceTopicStat"("userId", "topicKey");

-- CreateIndex
CREATE INDEX "PerformanceTopicStat_userId_subject_idx" ON "PerformanceTopicStat"("userId", "subject");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceDailySnapshot_userId_dayKey_key" ON "PerformanceDailySnapshot"("userId", "dayKey");

-- CreateIndex
CREATE INDEX "PerformanceDailySnapshot_userId_dayKey_idx" ON "PerformanceDailySnapshot"("userId", "dayKey");

-- CreateIndex
CREATE INDEX "PerformanceInsightRecord_userId_createdAt_idx" ON "PerformanceInsightRecord"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "PerformanceAttemptMetric" ADD CONSTRAINT "PerformanceAttemptMetric_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceTopicStat" ADD CONSTRAINT "PerformanceTopicStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceDailySnapshot" ADD CONSTRAINT "PerformanceDailySnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceInsightRecord" ADD CONSTRAINT "PerformanceInsightRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
