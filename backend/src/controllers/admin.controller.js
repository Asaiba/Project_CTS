import { prisma } from "../lib/prisma.js";

const publicUser = (user) => ({
  id: user.id,
  email: user.email,
  username: user.username,
  role: user.role,
  walletAddress: user.walletAddress,
  isActive: user.isActive,
});

export const listUsers = async (req, res) => {
  const { page, limit, q } = req.validated.query;
  const skip = (page - 1) * limit;

  const where = q
    ? {
        OR: [
          { email: { contains: q, mode: "insensitive" } },
          { username: { contains: q, mode: "insensitive" } },
          { walletAddress: { contains: q, mode: "insensitive" } },
        ],
      }
    : {};

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
