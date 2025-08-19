export const errorHandler = (fn) => {
  return async (req, res, next) => {
    fn(req, res, next).catch((err) => {
      res.status(500).json({
        error: "internal server error",
        message: err.message,
        stack: process.env.MOOD === "production" ? null : err.stack,
      });
    });
  };
};
