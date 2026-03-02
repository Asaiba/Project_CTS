import { prisma } from "../lib/prisma.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { randomToken, sha256 } from "../utils/crypto.js";
import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env.js";

const normalizeWallet = (walletAddress) => (walletAddress ? walletAddress.trim().toLowerCase() : null);
const googleClient = new OAuth2Client();

const tokenPayload = (user) => ({ sub: user.id, role: user.role, email: user.email });

export const issueAuthTokens = async (user) => {
  const accessToken = signAccessToken(tokenPayload(user));
  const refreshToken = signRefreshToken(tokenPayload(user));

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken };
};

export const registerUser = async ({ email, username, password, role, walletAddress }) => {
  const enforcedRole = role === "donor" ? "donor" : "student";
  const passwordHash = await hashPassword(password);

  return prisma.user.create({
    data: {
      email: email.trim().toLowerCase(),
      username: username.trim(),
      passwordHash,
      role: enforcedRole,
      walletAddress: normalizeWallet(walletAddress),
    },
  });
};

export const loginWithEmailPassword = async ({ email, password }) => {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!user || !user.passwordHash) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  return user;
};

export const loginWithWallet = async ({ walletAddress }) => {
  const user = await prisma.user.findFirst({
    where: { walletAddress: normalizeWallet(walletAddress) },
  });
  return user || null;
};

export const loginWithGoogleIdToken = async ({ idToken }) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: env.googleClientId,
  });

  const payload = ticket.getPayload();
  const email = payload?.email?.trim().toLowerCase();
  const emailVerified = payload?.email_verified;
  const rawName = payload?.name?.trim();

  if (!email || !emailVerified) return null;

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (user) return user;

  const fallbackUsername = email.split("@")[0] || "google_user";
  const username = rawName || fallbackUsername;

  user = await prisma.user.create({
    data: {
      email,
      username: username.slice(0, 60),
      role: "student",
      passwordHash: null,
    },
  });

  return user;
};

export const rotateRefreshToken = async (refreshToken) => {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = sha256(refreshToken);
  const tokenRow = await prisma.refreshToken.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
  });

  if (!tokenRow) return null;

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) return null;

  await prisma.refreshToken.update({
    where: { id: tokenRow.id },
    data: { revokedAt: new Date() },
  });

  return issueAuthTokens(user);
};

export const revokeRefreshToken = async (refreshToken) => {
  const tokenHash = sha256(refreshToken);
  await prisma.refreshToken.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const createPasswordResetToken = async (email) => {
  const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (!user) return null;

  const token = randomToken(24);
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  return token;
};

export const resetPasswordWithToken = async ({ token, newPassword }) => {
  const tokenHash = sha256(token);
  const row = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!row) return false;

  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
  ]);
  return true;
};

export const normalizeWalletAddress = normalizeWallet;
