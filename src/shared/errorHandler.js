export default function errorHandler(err, req, res, next) {
  // defaults
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err?.name === "SequelizeUniqueConstraintError") {
    statusCode = 400;
    const field = err?.errors?.[0]?.path;
    message = field ? `${field} already in use` : "Unique constraint violation";
  }

  // log unexpected errors
  if (!err.isOperational) {
    console.error("UNEXPECTED ERROR", err);
  }

  res.status(statusCode).json({
    status: err.status || "error",
    message,
  });
}
