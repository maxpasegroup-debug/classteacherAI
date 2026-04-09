-- AlterTable
ALTER TABLE "UsageStat" ADD COLUMN     "aiTokensPrompt" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "UsageStat" ADD COLUMN     "aiTokensCompletion" INTEGER NOT NULL DEFAULT 0;
