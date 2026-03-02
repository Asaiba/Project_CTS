export const notFound = (_req, res) => {
  return res.status(404).json({ error: "not_found", message: "Resource not found" });
};
