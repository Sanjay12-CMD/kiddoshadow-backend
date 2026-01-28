export const schoolScope = (req, res, next) => {
  if (req.user.role === "super_admin") {
    return next();
  }

  const schoolId =
    req.params.school_id ||
    req.body.school_id ||
    req.query.school_id;

  if (!schoolId) {
    return res.status(400).json({ message: "school_id required" });
  }

  if (req.user.school_id !== schoolId) {
    return res.status(403).json({ message: "Cross-school access denied" });
  }

  next();
}
