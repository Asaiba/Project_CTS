export const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "unauthorized", message: "Missing auth user" });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ error: "forbidden", message: "Insufficient role permissions" });
  }
  return next();
};
