import { prisma } from "../lib/prisma.js";
import { verifyAccessToken } from "../lib/jwt.js";

const bearerToken = (header = "") => {
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return "";
  return token;
};

export const requireAuth = async (req, res, next) => {
  try {
    const token = bearerToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: "unauthorized", message: "Missing bearer token" });
    }

    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      return res.status(401).json({ error: "unauthorized", message: "Invalid auth context" });
    }

    req.user = user;
    return next();
  } catch (_error) {
    return res.status(401).json({ error: "unauthorized", message: "Invalid or expired token" });
  }
};
