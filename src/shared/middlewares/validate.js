import AppError from "../appError.js";

export const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    const message = err.errors?.[0]?.message || "Invalid request";
    next(new AppError(message, 400));
  }
};

