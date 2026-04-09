-- NexaCapability: new task types (run once per database)
ALTER TYPE "NexaCapability" ADD VALUE 'CONCEPT_TEACHING';
ALTER TYPE "NexaCapability" ADD VALUE 'EXAM_TIPS';
ALTER TYPE "NexaCapability" ADD VALUE 'CONTENT_CREATION';

-- User: persisted Nexa context (optional)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nexaStudentLevel" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nexaStudentSubject" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nexaTeacherSubject" TEXT;
