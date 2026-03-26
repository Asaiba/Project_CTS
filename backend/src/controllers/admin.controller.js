import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../utils/password.js";
import { randomToken } from "../utils/crypto.js";
import { createPasswordResetToken, normalizeWalletAddress } from "../services/auth.service.js";
import { buildPasswordResetLink, sendAccountSetupEmail } from "../services/mail.service.js";
import {
  clearUserOnChainByRole,
  registerUserOnChainByRole,
  roleNeedsOnChainRegistration,
  syncUserOnChainState,
} from "../services/onchain.service.js";
import { env } from "../config/env.js";

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
  walletAddress: user.walletAddress,
  logoUrl: user.logoUrl,
  isActive: user.isActive,
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

const rollbackOnChainSync = async ({ previous, next, context }) => {
  try {
    await syncUserOnChainState({ previous: next, next: previous });
  } catch (rollbackError) {
    console.error(`[${context}] Failed to roll back on-chain sync:`, rollbackError.message);
  }
};

const rollbackCreatedUser = async ({ created, context }) => {
  const issues = [];

  if (roleNeedsOnChainRegistration(created.role) && created.walletAddress) {
    try {
      await clearUserOnChainByRole({
        role: created.role,
        walletAddress: created.walletAddress,
      });
    } catch (error) {
      issues.push(`on-chain cleanup failed: ${error.message}`);
    }
  }

  try {
    await prisma.user.delete({ where: { id: created.id } });
  } catch (error) {
    issues.push(`database cleanup failed: ${error.message}`);
  }

  if (issues.length) {
    console.error(`[${context}]`, issues.join(" | "));
  }

  return issues;
};

export const listUsers = async (req, res) => {
  const { page, limit, q, role, isActive } = req.validated.query;
  const skip = (page - 1) * limit;

  const where = {};
  if (role) where.role = role;
  if (isActive !== undefined) where.isActive = isActive;
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
      { walletAddress: { contains: q, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return res.json({
    page,
    limit,
    total,
    items: items.map(publicUser),
  });
};

export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.validated.params;
    const { role } = req.validated.body;
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isActive: true, walletAddress: true, username: true },
    });
    if (!target) {
      return res.status(404).json({ error: "not_found", message: "User not found" });
    }
    if (target.role === "admin" && role !== "admin") {
      const otherActiveAdmins = await prisma.user.count({
        where: { role: "admin", isActive: true, id: { not: id } },
      });
      if (otherActiveAdmins < 1) {
        return res.status(409).json({ error: "last_admin", message: "Cannot demote the last active admin" });
      }
    }

    const previousState = buildEffectiveOnChainState(target);
    const nextState = buildEffectiveOnChainState({ ...target, role });

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
      const [updated] = await prisma.$transaction([
        prisma.user.update({
          where: { id },
          data: { role },
        }),
        prisma.auditLog.create({
          data: {
            actorUserId: req.user.id,
            targetUserId: id,
            action: "user.role.updated",
            metadata: { role, onChain },
          },
        }),
      ]);

      return res.json({ user: publicUser(updated), onChain });
    } catch (error) {
      await rollbackOnChainSync({ previous: previousState, next: nextState, context: "admin.updateUserRole" });
      return next(error);
    }
  } catch (error) {
    return next(error);
  }
};

export const createUser = async (req, res, next) => {
  try {
    const { email, username, role, walletAddress, logoUrl, password } = req.validated.body;
    const requiresOnChainRegistration = roleNeedsOnChainRegistration(role);
    if (requiresOnChainRegistration && !walletAddress) {
      return res.status(400).json({ error: "validation_error", message: "Wallet address is required" });
    }
    const providedPassword = typeof password === "string" ? password.trim() : "";
    if (providedPassword && providedPassword.length < 8) {
      return res.status(400).json({ error: "validation_error", message: "Password must be at least 8 characters" });
    }
    const initialPassword = providedPassword || randomToken(24);
    const passwordHash = await hashPassword(initialPassword);
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedWallet = normalizeWalletAddress(walletAddress);

    const created = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: username.trim(),
        role,
        walletAddress: normalizedWallet,
        logoUrl: logoUrl || null,
        passwordHash,
        isActive: true,
      },
    });

    // Register supported roles on-chain before returning a successful creation response.
    let onChainResult = { skipped: true, reason: "role_not_supported", txHash: null };
    try {
      onChainResult = await registerUserOnChainByRole({
        role: created.role,
        walletAddress: created.walletAddress,
        username: created.username,
      });
    } catch (onChainError) {
      await prisma.user.delete({ where: { id: created.id } }).catch(() => null);
      return res.status(onChainError.statusCode || 502).json({
        error: "onchain_registration_failed",
        message: onChainError.message || "On-chain registration failed",
      });
    }

    let passwordSetupEmail = { sent: false, reason: providedPassword ? "not_needed" : "pending" };
    let passwordSetupLink = null;

    if (!providedPassword) {
      const setupToken = await createPasswordResetToken(normalizedEmail);
      if (!setupToken) {
        const rollbackIssues = await rollbackCreatedUser({
          created,
          context: "admin.createUser.setupToken",
        });
        return res.status(502).json({
          error: "password_setup_failed",
          message: "Could not initialize the password setup flow.",
          cleanupIssues: rollbackIssues,
        });
      }

      passwordSetupLink = buildPasswordResetLink({
        token: setupToken,
        email: normalizedEmail,
        mode: "setup",
      });

      passwordSetupEmail = await sendAccountSetupEmail({
        toEmail: normalizedEmail,
        username: created.username,
        role: created.role,
        setupLink: passwordSetupLink,
      });

      if (!passwordSetupEmail.sent && env.nodeEnv === "production") {
        const rollbackIssues = await rollbackCreatedUser({
          created,
          context: "admin.createUser.passwordSetupEmail",
        });
        return res.status(502).json({
          error: "password_setup_email_failed",
          message: "Could not send the account setup email. The account was rolled back.",
          cleanupIssues: rollbackIssues,
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user.id,
        targetUserId: created.id,
        action: "user.created",
        metadata: {
          role: created.role,
          logoUrl: logoUrl || null,
          onChain: onChainResult,
          passwordSetupEmail,
        },
      },
    });

    return res.status(201).json({
      user: publicUser(created),
      passwordSetupEmail,
      passwordSetupLink: env.nodeEnv === "production" ? null : passwordSetupLink,
      usedProvidedPassword: Boolean(providedPassword),
      onChain: onChainResult,
    });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "conflict", message: "Email or wallet already exists" });
    }
    return next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.validated.params;
    const { role, email, username, walletAddress, logoUrl, isActive } = req.validated.body;
    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isActive: true, username: true, walletAddress: true },
    });
    if (!existing) {
      return res.status(404).json({ error: "not_found", message: "User not found" });
    }
    const nextRole = role || existing.role;
    const nextIsActive = isActive === undefined ? existing.isActive : isActive;
    if (existing.role === "admin" && (nextRole !== "admin" || !nextIsActive)) {
      const otherActiveAdmins = await prisma.user.count({
        where: { role: "admin", isActive: true, id: { not: id } },
      });
      if (otherActiveAdmins < 1) {
        return res.status(409).json({ error: "last_admin", message: "Cannot disable or demote the last active admin" });
      }
    }

    const nextUsername = username?.trim() ?? existing.username;
    const nextWalletAddress =
      walletAddress === undefined ? existing.walletAddress : normalizeWalletAddress(walletAddress);

    const previousState = buildEffectiveOnChainState(existing);
    const nextState = buildEffectiveOnChainState({
      role: nextRole,
      isActive: nextIsActive,
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
      const [updated] = await prisma.$transaction([
        prisma.user.update({
          where: { id },
          data: {
            role,
            email: email?.trim().toLowerCase(),
            username: username?.trim(),
            walletAddress: walletAddress === undefined ? undefined : nextWalletAddress,
            logoUrl: logoUrl === undefined ? undefined : logoUrl,
            isActive,
          },
        }),
        prisma.auditLog.create({
          data: {
            actorUserId: req.user.id,
            targetUserId: id,
            action: "user.updated",
            metadata: { role, email, username, walletAddress, logoUrl, isActive, onChain },
          },
        }),
      ]);

      return res.json({ user: publicUser(updated), onChain });
    } catch (error) {
      await rollbackOnChainSync({ previous: previousState, next: nextState, context: "admin.updateUser" });
      if (error.code === "P2002") {
        return res.status(409).json({ error: "conflict", message: "Email or wallet already exists" });
      }
      return next(error);
    }
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "conflict", message: "Email or wallet already exists" });
    }
    return next(error);
  }
};

export const deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.validated.params;
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, role: true, isActive: true, email: true, username: true, walletAddress: true, logoUrl: true },
    });
    if (!target) {
      return res.status(404).json({ error: "not_found", message: "User not found" });
    }
    if (target.role === "admin" && req.user.role !== "admin") {
      return res.status(403).json({ error: "forbidden", message: "Only admin can remove an admin account" });
    }
    if (target.role === "admin" && req.user.id === id) {
      return res.status(409).json({ error: "self_delete_blocked", message: "Admin cannot delete their own account" });
    }
    if (target.role === "admin") {
      const otherActiveAdmins = await prisma.user.count({
        where: { role: "admin", isActive: true, id: { not: id } },
      });
      if (otherActiveAdmins < 1) {
        return res.status(409).json({ error: "last_admin", message: "Cannot delete the last active admin" });
      }
    }

    const previousState = buildEffectiveOnChainState(target);
    const nextState = buildEffectiveOnChainState({ role: "", walletAddress: "", username: "", isActive: false });

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
      const [deleted] = await prisma.$transaction([
        prisma.user.delete({
          where: { id },
        }),
        prisma.auditLog.create({
          data: {
            actorUserId: req.user.id,
            targetUserId: null,
            action: "user.deleted",
            metadata: { deletedUserId: id, email: target.email, role: target.role, onChain },
          },
        }),
      ]);

      return res.json({ user: publicUser(deleted), onChain });
    } catch (error) {
      await rollbackOnChainSync({ previous: previousState, next: nextState, context: "admin.deactivateUser" });
      return next(error);
    }
  } catch (error) {
    return next(error);
  }
};
