import { prisma } from "../lib/prisma.js";
import { normalizeWalletAddress } from "../services/auth.service.js";
import { syncUserOnChainState } from "../services/onchain.service.js";

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
  walletAddress: user.walletAddress,
  logoUrl: user.logoUrl,
});

const buildEffectiveOnChainState = ({ role, walletAddress, username, isActive }) => {
  if (!isActive) {
    return { role: "", walletAddress: "", username: "" };
  }

  return {
    role,
    walletAddress,
    username,
  };
};

export const getMe = async (req, res) => {
  return res.json({ user: publicUser(req.user) });
};

export const listColleges = async (_req, res) => {
  const colleges = await prisma.user.findMany({
    where: {
      role: "college",
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      email: true,
      walletAddress: true,
      logoUrl: true,
    },
  });

  return res.json({ items: colleges });
};

export const listDaoMembers = async (_req, res) => {
  const daoMembers = await prisma.user.findMany({
    where: {
      role: "dao",
      isActive: true,
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      email: true,
      walletAddress: true,
      logoUrl: true,
    },
  });

  return res.json({ items: daoMembers });
};

export const updateMe = async (req, res, next) => {
  try {
    const { username, walletAddress } = req.validated.body;
    const nextUsername = username ?? req.user.username;
    const nextWalletAddress =
      walletAddress === undefined ? req.user.walletAddress : normalizeWalletAddress(walletAddress);

    const previousState = buildEffectiveOnChainState(req.user);
    const nextState = buildEffectiveOnChainState({
      role: req.user.role,
      isActive: req.user.isActive,
      username: nextUsername,
      walletAddress: nextWalletAddress,
    });

    let onChain = { changed: false, operations: [] };
    try {
      onChain = await syncUserOnChainState({ previous: previousState, next: nextState });
    } catch (error) {
      return res.status(error.statusCode || 502).json({
        error: "onchain_sync_failed",
        message: error.message || "On-chain sync failed",
      });
    }

    try {
      const updated = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          username: username ?? undefined,
          walletAddress: walletAddress === undefined ? undefined : nextWalletAddress,
        },
      });
      return res.json({ user: publicUser(updated), onChain });
    } catch (error) {
      try {
        await syncUserOnChainState({ previous: nextState, next: previousState });
      } catch (rollbackError) {
        console.error("[user.updateMe] Failed to roll back on-chain sync:", rollbackError.message);
      }
      if (error.code === "P2002") {
        return res.status(409).json({ error: "conflict", message: "Wallet address already in use" });
      }
      return next(error);
    }
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "conflict", message: "Wallet address already in use" });
    }
    return next(error);
  }
};
