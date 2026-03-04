import { prisma } from "../lib/prisma.js";
import { hashPassword } from "../utils/password.js";
import { randomToken } from "../utils/crypto.js";
import { normalizeWalletAddress } from "../services/auth.service.js";
import { sendTempPasswordEmail } from "../services/mail.service.js";

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
  walletAddress: user.walletAddress,
  logoUrl: user.logoUrl,
  isActive: user.isActive,
});

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

export const updateUserRole = async (req, res) => {
  const { id } = req.validated.params;
  const { role } = req.validated.body;
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, isActive: true },
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

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: req.user.id,
      targetUserId: updated.id,
      action: "user.role.updated",
      metadata: { role },
    },
  });

  return res.json({ user: publicUser(updated) });
};

export const createUser = async (req, res, next) => {
  try {
    const { email, username, role, walletAddress, logoUrl, password } = req.validated.body;
    if (!walletAddress) {
      return res.status(400).json({ error: "validation_error", message: "Wallet address is required" });
    }
    const providedPassword = typeof password === "string" ? password.trim() : "";
    if (providedPassword && providedPassword.length < 8) {
      return res.status(400).json({ error: "validation_error", message: "Password must be at least 8 characters" });
    }
    const generatedPassword = providedPassword || randomToken(8);
    const passwordHash = await hashPassword(generatedPassword);
    const normalizedEmail = email.trim().toLowerCase();

    const created = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: username.trim(),
        role,
        walletAddress: normalizeWalletAddress(walletAddress),
        logoUrl: logoUrl || null,
        passwordHash,
        isActive: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user.id,
        targetUserId: created.id,
        action: "user.created",
        metadata: { role: created.role, logoUrl: logoUrl || null },
      },
    });

    let emailDelivery = { sent: false, reason: "not_needed" };
    if (!providedPassword) {
      try {
        emailDelivery = await sendTempPasswordEmail({
          toEmail: normalizedEmail,
          username: created.username,
          tempPassword: generatedPassword,
          role: created.role,
        });
      } catch (mailError) {
        emailDelivery = { sent: false, reason: "send_failed" };
      }
    }

    return res.status(201).json({
      user: publicUser(created),
      generatedPassword: providedPassword ? null : generatedPassword,
      tempPasswordEmail: emailDelivery,
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
      select: { id: true, role: true, isActive: true },
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

    const updated = await prisma.user.update({
      where: { id },
      data: {
        role,
        email: email?.trim().toLowerCase(),
        username: username?.trim(),
        walletAddress: walletAddress === undefined ? undefined : normalizeWalletAddress(walletAddress),
        logoUrl: logoUrl === undefined ? undefined : logoUrl,
        isActive,
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: req.user.id,
        targetUserId: updated.id,
        action: "user.updated",
        metadata: { role, email, username, walletAddress, logoUrl, isActive },
      },
    });

    return res.json({ user: publicUser(updated) });
  } catch (error) {
    if (error.code === "P2002") {
      return res.status(409).json({ error: "conflict", message: "Email or wallet already exists" });
    }
    return next(error);
  }
};

export const deactivateUser = async (req, res) => {
  const { id } = req.validated.params;
  const target = await prisma.user.findUnique({
    where: { id },
    select: { id: true, role: true, isActive: true, email: true },
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
  const deleted = await prisma.user.delete({
    where: { id },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: req.user.id,
      targetUserId: deleted.id,
      action: "user.deleted",
      metadata: { email: deleted.email, role: deleted.role },
    },
  });

  return res.json({ user: publicUser(deleted) });
};
