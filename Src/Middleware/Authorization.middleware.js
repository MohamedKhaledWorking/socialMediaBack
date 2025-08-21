export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      if (!allowedRoles.includes(user.role)) {
        return res.status(401).json({
          status: "failure",
          message: "Access denied. You don't have permission",
        });
      }
      next();
    } catch (err) {
      return res.status(500).json({
        error: "Internal server error",
        message: err.message,
        stack: process.env.MOOD === "production" ? null : err.stack,
      });
    }
  };
}
