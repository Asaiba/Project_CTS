import { prisma } from "../lib/prisma.js";

const APP_MESSAGE_PREFIX = "CTS_APP_V1:";

const encodeApplicationMessage = ({ title = "", description = "", message = "" }) => {
  const payload = {
    title: String(title || "").trim(),
    description: String(description || "").trim(),
    message: String(message || "").trim(),
  };
  return `${APP_MESSAGE_PREFIX}${JSON.stringify(payload)}`;
};

const decodeApplicationMessage = (rawMessage) => {
  const raw = String(rawMessage || "");
  if (!raw) return { title: "", description: "", message: "" };
  if (!raw.startsWith(APP_MESSAGE_PREFIX)) {
    return { title: raw, description: "", message: raw };
  }
  try {
    const parsed = JSON.parse(raw.slice(APP_MESSAGE_PREFIX.length));
    const title = String(parsed?.title || "").trim();
    const description = String(parsed?.description || "").trim();
    const message = String(parsed?.message || "").trim();
    return { title, description, message: message || title };
  } catch (_error) {
    return { title: raw, description: "", message: raw };
  }
};

const toPublicApplication = (application) => {
  const decoded = decodeApplicationMessage(application.message);
  return {
  id: application.id,
  status: application.status,
  message: decoded.message,
  title: decoded.title,
  description: decoded.description,
  createdAt: application.createdAt,
  updatedAt: application.updatedAt,
  student: application.student
    ? {
        id: application.student.id,
        email: application.student.email,
        username: application.student.username,
        walletAddress: application.student.walletAddress,
        logoUrl: application.student.logoUrl,
      }
    : null,
  college: application.college
    ? {
        id: application.college.id,
        email: application.college.email,
        username: application.college.username,
        walletAddress: application.college.walletAddress,
        logoUrl: application.college.logoUrl,
      }
    : null,
};
};

export const createApplication = async (req, res) => {
  const { collegeId, title, description, message } = req.validated.body;

  const college = await prisma.user.findFirst({
    where: { id: collegeId, role: "college", isActive: true },
    select: { id: true },
  });
  if (!college) {
    return res.status(404).json({ error: "not_found", message: "College not found" });
  }

  const created = await prisma.collegeApplication.create({
    data: {
      studentId: req.user.id,
      collegeId,
      message: encodeApplicationMessage({ title, description, message }),
      status: "pending",
    },
    include: {
      student: { select: { id: true, email: true, username: true, walletAddress: true, logoUrl: true } },
      college: { select: { id: true, email: true, username: true, walletAddress: true, logoUrl: true } },
    },
  });

  return res.status(201).json({ application: toPublicApplication(created) });
};

export const listMyApplications = async (req, res) => {
  const items = await prisma.collegeApplication.findMany({
    where: { studentId: req.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      college: { select: { id: true, email: true, username: true, walletAddress: true, logoUrl: true } },
    },
  });
  return res.json({ items: items.map(toPublicApplication) });
};

export const listCollegeApplications = async (req, res) => {
  const { status, limit } = req.validated.query;
  const where = { collegeId: req.user.id };
  if (status) where.status = status;

  const [items, grouped] = await Promise.all([
    prisma.collegeApplication.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
      include: {
        student: { select: { id: true, email: true, username: true, walletAddress: true, logoUrl: true } },
      },
    }),
    prisma.collegeApplication.groupBy({
      by: ["status"],
      where: { collegeId: req.user.id },
      _count: { _all: true },
    }),
  ]);

  const summary = {
    total: grouped.reduce((acc, row) => acc + row._count._all, 0),
    pending: 0,
    approved: 0,
    rejected: 0,
  };
  for (const row of grouped) {
    summary[row.status] = row._count._all;
  }

  return res.json({
    summary,
    items: items.map(toPublicApplication),
  });
};

export const updateApplicationStatus = async (req, res) => {
  const { id } = req.validated.params;
  const { status } = req.validated.body;

  const existing = await prisma.collegeApplication.findUnique({
    where: { id },
    select: { id: true, collegeId: true },
  });

  if (!existing || existing.collegeId !== req.user.id) {
    return res.status(404).json({ error: "not_found", message: "Application not found" });
  }

  const updated = await prisma.collegeApplication.update({
    where: { id },
    data: { status },
    include: {
      student: { select: { id: true, email: true, username: true, walletAddress: true, logoUrl: true } },
      college: { select: { id: true, email: true, username: true, walletAddress: true, logoUrl: true } },
    },
  });

  return res.json({ application: toPublicApplication(updated) });
};

export const deleteMyApplication = async (req, res) => {
  const { id } = req.validated.params;

  const existing = await prisma.collegeApplication.findUnique({
    where: { id },
    select: { id: true, studentId: true, status: true },
  });
  if (!existing || existing.studentId !== req.user.id) {
    return res.status(404).json({ error: "not_found", message: "Application not found" });
  }
  if (existing.status !== "pending") {
    return res.status(409).json({
      error: "cannot_cancel",
      message: "You can only cancel an application before voting/decision is completed",
    });
  }

  await prisma.collegeApplication.delete({
    where: { id },
  });
  return res.status(204).send();
};
