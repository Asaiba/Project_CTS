import { prisma } from "../lib/prisma.js";

const toPublicProposal = (proposal, requesterId = "") => {
  const votes = proposal.votes || [];
  const yesVotes = votes.filter((v) => v.choice === "yes").length;
  const noVotes = votes.filter((v) => v.choice === "no").length;
  const myVote = votes.find((v) => v.voterId === requesterId)?.choice || null;
  const now = Date.now();
  const deadlineTs = new Date(proposal.deadlineAt).getTime();
  return {
    id: proposal.id,
    title: proposal.title,
    description: proposal.description,
    deadlineAt: proposal.deadlineAt,
    createdAt: proposal.createdAt,
    isActive: deadlineTs > now,
    remainingMs: Math.max(0, deadlineTs - now),
    college: proposal.college
      ? {
          id: proposal.college.id,
          username: proposal.college.username,
          email: proposal.college.email,
          logoUrl: proposal.college.logoUrl,
        }
      : null,
    votes: {
      yes: yesVotes,
      no: noVotes,
      total: yesVotes + noVotes,
    },
    myVote,
  };
};

export const createProposal = async (req, res) => {
  const { title, description, durationMinutes } = req.validated.body;
  const deadlineAt = new Date(Date.now() + durationMinutes * 60 * 1000);

  const proposal = await prisma.proposal.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      collegeId: req.user.id,
      deadlineAt,
    },
    include: {
      college: {
        select: { id: true, username: true, email: true, logoUrl: true },
      },
      votes: true,
    },
  });

  return res.status(201).json({ proposal: toPublicProposal(proposal, req.user.id) });
};

export const listProposals = async (req, res) => {
  const { mine, active } = req.validated.query;
  const where = {};

  if (mine) {
    where.collegeId = req.user.id;
  }
  if (active === true) {
    where.deadlineAt = { gt: new Date() };
  }
  if (active === false) {
    where.deadlineAt = { lte: new Date() };
  }

  const proposals = await prisma.proposal.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      college: {
        select: { id: true, username: true, email: true, logoUrl: true },
      },
      votes: {
        select: { voterId: true, choice: true },
      },
    },
  });

  return res.json({
    items: proposals.map((proposal) => toPublicProposal(proposal, req.user.id)),
  });
};

export const voteProposal = async (req, res) => {
  const { id } = req.validated.params;
  const { choice } = req.validated.body;

  const proposal = await prisma.proposal.findUnique({
    where: { id },
    include: {
      college: {
        select: { id: true, username: true, email: true, logoUrl: true },
      },
      votes: {
        select: { voterId: true, choice: true },
      },
    },
  });

  if (!proposal) {
    return res.status(404).json({ error: "not_found", message: "Proposal not found" });
  }
  if (new Date(proposal.deadlineAt).getTime() <= Date.now()) {
    return res.status(400).json({ error: "voting_closed", message: "Voting duration has ended for this proposal" });
  }

  await prisma.proposalVote.upsert({
    where: {
      proposalId_voterId: {
        proposalId: id,
        voterId: req.user.id,
      },
    },
    create: {
      proposalId: id,
      voterId: req.user.id,
      choice,
    },
    update: {
      choice,
    },
  });

  const refreshed = await prisma.proposal.findUnique({
    where: { id },
    include: {
      college: {
        select: { id: true, username: true, email: true, logoUrl: true },
      },
      votes: {
        select: { voterId: true, choice: true },
      },
    },
  });

  return res.json({ proposal: toPublicProposal(refreshed, req.user.id) });
};
