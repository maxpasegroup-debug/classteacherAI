-- Migrate User.role (single) -> User.roles (array)

ALTER TABLE "User" ADD COLUMN "roles" "UserRole"[] DEFAULT ARRAY[]::"UserRole"[];

UPDATE "User" SET "roles" = ARRAY["role"]::"UserRole"[] WHERE cardinality("roles") = 0;

ALTER TABLE "User" ALTER COLUMN "roles" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "roles" SET DEFAULT ARRAY[]::"UserRole"[];

ALTER TABLE "User" DROP COLUMN "role";
