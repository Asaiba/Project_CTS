ALTER TABLE "users"
ADD COLUMN "eula_accepted_at" TIMESTAMP(3),
ADD COLUMN "privacy_policy_accepted_at" TIMESTAMP(3),
ADD COLUMN "legal_version_accepted" TEXT;
