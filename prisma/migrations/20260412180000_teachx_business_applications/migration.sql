-- CreateEnum
CREATE TYPE "TeachxBizAppType" AS ENUM ('TUTOR_ONE_ON_ONE', 'ROOTSCARE_PARTNER');

-- CreateEnum
CREATE TYPE "TeachxBizAppStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "TeachxBusinessApplication" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "TeachxBizAppType" NOT NULL,
    "status" "TeachxBizAppStatus" NOT NULL DEFAULT 'PENDING',
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeachxBusinessApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TeachxBusinessApplication_userId_type_idx" ON "TeachxBusinessApplication"("userId", "type");

-- CreateIndex
CREATE INDEX "TeachxBusinessApplication_userId_createdAt_idx" ON "TeachxBusinessApplication"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "TeachxBusinessApplication" ADD CONSTRAINT "TeachxBusinessApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
