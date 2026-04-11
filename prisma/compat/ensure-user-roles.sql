-- Legacy billing column renames only.
-- User roles were removed in favor of a student-only app + string plan/status.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'planExpiry'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'subscriptionExpiry'
  ) THEN
    ALTER TABLE "User" RENAME COLUMN "planExpiry" TO "subscriptionExpiry";
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'aiCredits'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'User' AND column_name = 'credits'
  ) THEN
    ALTER TABLE "User" RENAME COLUMN "aiCredits" TO "credits";
  END IF;
END $$;
