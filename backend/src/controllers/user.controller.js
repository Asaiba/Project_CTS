import { prisma } from "../lib/prisma.js";
import { normalizeWalletAddress } from "../services/auth.service.js";

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
  walletAddress: user.walletAddress,
});

export const getMe = async (req, res) => {
  return res.json({ user: publicUser(req.user) });
};

export const updateMe = async (req, res, next) => {
  try {
    const { username, walletAddress } = req.validated.body;
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        username: username ?? undefined,
        walletAddress: walletAddress === undefined ? undefined : normalizeWalletAddress(walletAddress),
      },
    });
    return res.json({ user: publicUser(updated) });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "conflict", message: "Wallet address already in use" });
    }
    return next(error);
  }
};
