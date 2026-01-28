export default function errorHandler(err, req, res, next) {
  // defaults
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // log unexpected errors
  if (!err.isOperational) {
    console.error("UNEXPECTED ERROR 💥", err);
  }

  res.status(statusCode).json({
    status: err.status || "error",
    message,
  });
}
