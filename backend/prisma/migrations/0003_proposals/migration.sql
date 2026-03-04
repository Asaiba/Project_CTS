-- CreateEnum
CREATE TYPE "VoteChoice" AS ENUM ('yes', 'no');

-- CreateTable
CREATE TABLE "proposals" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "college_id" UUID NOT NULL,
    "deadline_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proposal_votes" (
    "id" UUID NOT NULL,
    "proposal_id" UUID NOT NULL,
    "voter_id" UUID NOT NULL,
    "choice" "VoteChoice" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "proposal_votes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "proposal_votes_proposal_id_voter_id_key" ON "proposal_votes"("proposal_id", "voter_id");

-- AddForeignKey
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_college_id_fkey" FOREIGN KEY ("college_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_votes" ADD CONSTRAINT "proposal_votes_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "proposal_votes" ADD CONSTRAINT "proposal_votes_voter_id_fkey" FOREIGN KEY ("voter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
