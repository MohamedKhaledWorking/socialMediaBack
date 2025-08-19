export const validateSchema = (schema) => {
  return (req, res, next) => {
    const data = { ...req.body, ...req.query, ...req.params };
    if (req.headers.authorization) {
      data.authorization = req.headers.authorization.split(" ")[1];
    }

    const result = schema.validate(data, { abortEarly: false });
    if (result.error) {
      return res.status(400).json({
        message: "validation error",
        errors: result.error.details.map((err) => {
          return {
            field: err.context.label,
            message: err.message,
            type: err.type,
          };
        }),
      });
    }
    next();
  };
};
