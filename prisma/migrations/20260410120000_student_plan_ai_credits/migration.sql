-- Rename enum label NEXT_LEVEL -> TOP10 (PostgreSQL 10+)
ALTER TYPE "SubscriptionPlan" RENAME VALUE 'NEXT_LEVEL' TO 'TOP10';

-- Rename User billing columns
ALTER TABLE "User" RENAME COLUMN "subscriptionExpiry" TO "planExpiry";
ALTER TABLE "User" RENAME COLUMN "credits" TO "aiCredits";
