-- Student-only user model: string plan/status, remove roles, map TOP10 -> TOPRANK, EXPIRED -> INACTIVE

-- Transaction.plan: enum -> text
ALTER TABLE "Transaction" ADD COLUMN IF NOT EXISTS "plan_new" TEXT;
UPDATE "Transaction" SET "plan_new" = CASE
  WHEN "plan" IS NULL THEN NULL
  WHEN "plan"::text = 'TOP10' THEN 'TOPRANK'
  ELSE "plan"::text
END;
ALTER TABLE "Transaction" DROP COLUMN IF EXISTS "plan";
ALTER TABLE "Transaction" RENAME COLUMN "plan_new" TO "plan";

-- User.plan and subscriptionStatus: enum -> text
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "plan_new" TEXT NOT NULL DEFAULT 'BASIC';
UPDATE "User" SET "plan_new" = CASE
  WHEN "plan"::text = 'TOP10' THEN 'TOPRANK'
  ELSE "plan"::text
END;

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "subscriptionStatus_new" TEXT NOT NULL DEFAULT 'INACTIVE';
UPDATE "User" SET "subscriptionStatus_new" = CASE
  WHEN "subscriptionStatus"::text = 'EXPIRED' THEN 'INACTIVE'
  ELSE "subscriptionStatus"::text
END;

ALTER TABLE "User" DROP COLUMN IF EXISTS "plan";
ALTER TABLE "User" DROP COLUMN IF EXISTS "subscriptionStatus";
ALTER TABLE "User" RENAME COLUMN "plan_new" TO "plan";
ALTER TABLE "User" RENAME COLUMN "subscriptionStatus_new" TO "subscriptionStatus";
ALTER TABLE "User" ALTER COLUMN "plan" SET DEFAULT 'BASIC';
ALTER TABLE "User" ALTER COLUMN "subscriptionStatus" SET DEFAULT 'INACTIVE';

ALTER TABLE "User" DROP COLUMN IF EXISTS "roles";
ALTER TABLE "User" DROP COLUMN IF EXISTS "nexaTeacherSubject";

DROP TYPE IF EXISTS "SubscriptionPlan";
DROP TYPE IF EXISTS "SubscriptionStatus";
DROP TYPE IF EXISTS "UserRole";
