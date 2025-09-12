// export const errorHandler = (fn) => {
//   return async (req, res, next) => {
//     fn(req, res, next).catch((err) => {
//       res.status(500).json({
//         error: "internal server error",
//         message: err.message,
//         stack: process.env.MOOD === "production" ? null : err.stack,
//       });
//     });
//   };
// };


// Src/Middleware/errorHandler.middleware.js
export const errorHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next); // works for sync and async
    } catch (err) {
      if (res.headersSent) return next(err); // avoid double send

      const status = err.status || err.statusCode || 500;
      const isProd =
        (process.env.NODE_ENV || process.env.MOOD) === "production";

      res.status(status).json({
        error: status === 500 ? "internal server error" : err.name || "Error",
        message: err.message,
        stack: isProd ? undefined : err.stack,
      });
    }
  };
};
