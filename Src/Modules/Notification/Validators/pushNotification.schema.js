import Joi from "joi";

export const pushSubscriptionSchema = Joi.object({
  endpoint: Joi.string()
    .uri()
    .required()
    .messages({
      "any.required": "Push subscription endpoint is required",
      "string.uri": "Endpoint must be a valid URI",
    }),
  keys: Joi.object({
    p256dh: Joi.string()
      .required()
      .messages({
        "any.required": "P256DH key is required",
      }),
    auth: Joi.string()
      .required()
      .messages({
        "any.required": "Auth key is required",
      }),
  }).required(),
}); 