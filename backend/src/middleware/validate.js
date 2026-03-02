export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    return res.status(400).json({
      error: "validation_error",
      message: "Invalid request payload",
      details: result.error.flatten(),
    });
  }

  req.validated = result.data;
  return next();
};
