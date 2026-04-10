-- CreateTable
CREATE TABLE "TopRankVisionBoard" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "examTrack" TEXT NOT NULL,
    "targetRank" INTEGER NOT NULL,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "dreamCollege" TEXT NOT NULL,
    "goalCardLine" TEXT NOT NULL,
    "envStudyTable" BOOLEAN NOT NULL DEFAULT false,
    "envDistractionFree" BOOLEAN NOT NULL DEFAULT false,
    "envDailySchedule" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TopRankVisionBoard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TopRankVisionBoard_userId_key" ON "TopRankVisionBoard"("userId");

-- AddForeignKey
ALTER TABLE "TopRankVisionBoard" ADD CONSTRAINT "TopRankVisionBoard_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
