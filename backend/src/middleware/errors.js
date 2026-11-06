export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}
export function notFound(_req, _res, next) {
  next(new ApiError(404, "Route not found."));
}
export function errorHandler(error, _req, res, _next) {
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({
    message:
      status >= 500 ? "The service is temporarily unavailable." : error.message,
    details: error.details,
  });
}
export const asyncRoute = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
