DO $$
BEGIN
  -- Add new roles[] column if this database is still on legacy schema.
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'roles'
  ) THEN
    ALTER TABLE "User"
      ADD COLUMN "roles" "UserRole"[] NOT NULL DEFAULT ARRAY[]::"UserRole"[];
  END IF;

  -- Backfill roles[] from legacy role column when present.
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'User'
      AND column_name = 'role'
  ) THEN
    UPDATE "User"
    SET "roles" = ARRAY["role"]::"UserRole"[]
    WHERE cardinality("roles") = 0;
  END IF;
END $$;
