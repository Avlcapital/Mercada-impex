import { ApiError } from "./errors.js";
export const validate = (schema) => (req, _res, next) => {
  const parsed = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query,
  });
  if (!parsed.success)
    return next(
      new ApiError(
        400,
        "Please correct the highlighted fields.",
        parsed.error.flatten(),
      ),
    );
  req.body = parsed.data.body;
  req.params = parsed.data.params;
  next();
};
