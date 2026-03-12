import { prisma } from "../lib/prisma.js";
import {
  createPasswordResetToken,
  issueAuthTokens,
  loginWithEmailPassword,
  loginWithGoogleIdToken,
  registerUser,
  resetPasswordWithToken,
  revokeRefreshToken,
  rotateRefreshToken,
} from "../services/auth.service.js";
import { registerStudentOnChainByOwner } from "../services/onchain.service.js";
import { env } from "../config/env.js";

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
  walletAddress: user.walletAddress,
  logoUrl: user.logoUrl,
});

export const register = async (req, res, next) => {
  try {
    const user = await registerUser(req.validated.body);
    try {
      await registerStudentOnChainByOwner({
        walletAddress: user.walletAddress,
        username: user.username,
      });
    } catch (chainError) {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => null);
      return res
        .status(chainError.statusCode || 502)
        .json({ error: "onchain_registration_failed", message: chainError.message || "On-chain registration failed" });
    }
    const tokens = await issueAuthTokens(user);
    return res.status(201).json({ user: publicUser(user), ...tokens });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "conflict", message: "Email or wallet already exists" });
    }
    return next(error);
  }
};

export const login = async (req, res) => {
  const user = await loginWithEmailPassword(req.validated.body);
  if (!user) {
    return res.status(401).json({ error: "invalid_credentials", message: "Invalid email or password" });
  }

  const tokens = await issueAuthTokens(user);
  return res.json({ user: publicUser(user), ...tokens });
};

export const loginWallet = async (req, res, next) => {
  try {
    const body = req.validated?.body || req.body || {};
    const rawAddress = body.address || body.walletAddress;

    if (!rawAddress) {
      return res.status(400).json({ message: "Wallet address is required" });
    }

    const normalizedAddress = String(rawAddress).trim().toLowerCase();
    if (!normalizedAddress) {
      return res.status(400).json({ message: "Wallet address is required" });
    }

    const user = await prisma.user.findUnique({
      where: {
        walletAddress: normalizedAddress,
      },
    });

    if (!user) {
      return res.status(404).json({ message: "Wallet not registered" });
    }

    const tokens = await issueAuthTokens(user);
    return res.json({ user: publicUser(user), ...tokens });
  } catch (error) {
    return next(error);
  }
};

export const loginGoogle = async (req, res, next) => {
  try {
    if (!env.googleClientId) {
      return res
        .status(503)
        .json({ error: "google_not_configured", message: "Google login is not configured on the server" });
    }

    const user = await loginWithGoogleIdToken(req.validated.body);
    if (!user) {
      return res
        .status(401)
        .json({ error: "google_not_registered", message: "Google email is not registered in CTS" });
    }

    const tokens = await issueAuthTokens(user);
    return res.json({ user: publicUser(user), ...tokens });
  } catch (error) {
    return next(error);
  }
};

export const refresh = async (req, res) => {
  const tokens = await rotateRefreshToken(req.validated.body.refreshToken);
  if (!tokens) {
    return res.status(401).json({ error: "invalid_refresh", message: "Invalid refresh token" });
  }
  return res.json(tokens);
};

export const logout = async (req, res) => {
  const refreshToken = req.body?.refreshToken || "";
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
  }
  return res.status(204).send();
};

export const forgotPassword = async (req, res) => {
  const token = await createPasswordResetToken(req.validated.body.email);
  return res.json({
    message: "If account exists, reset link has been generated",
    devResetToken: token || null,
  });
};

export const resetPassword = async (req, res) => {
  const ok = await resetPasswordWithToken({
    token: req.validated.body.token,
    newPassword: req.validated.body.newPassword,
  });
  if (!ok) {
    return res.status(400).json({ error: "invalid_token", message: "Invalid or expired reset token" });
  }
  return res.json({ message: "Password reset successful" });
};

export const whoami = async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  return res.json({ user: publicUser(user) });
};
