CREATE TYPE "ApplicationStatus" AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE "college_applications" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "college_id" UUID NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'pending',
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "college_applications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "college_applications_student_id_college_id_key" ON "college_applications"("student_id", "college_id");
CREATE INDEX "college_applications_college_id_status_idx" ON "college_applications"("college_id", "status");
CREATE INDEX "college_applications_student_id_idx" ON "college_applications"("student_id");

ALTER TABLE "college_applications"
ADD CONSTRAINT "college_applications_student_id_fkey"
FOREIGN KEY ("student_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "college_applications"
ADD CONSTRAINT "college_applications_college_id_fkey"
FOREIGN KEY ("college_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
