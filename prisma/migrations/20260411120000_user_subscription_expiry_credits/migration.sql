-- Align User billing fields with application naming: subscriptionExpiry + credits
ALTER TABLE "User" RENAME COLUMN "planExpiry" TO "subscriptionExpiry";
ALTER TABLE "User" RENAME COLUMN "aiCredits" TO "credits";
