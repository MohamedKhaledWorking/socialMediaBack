import Joi from "joi";

export const sendMessageSchema = Joi.object({
  receiverId: Joi.string()
    .required()
    .messages({
      "any.required": "Receiver ID is required",
    }),
  message: Joi.string()
    .min(1)
    .max(1000)
    .required()
    .messages({
      "string.min": "Message cannot be empty",
      "string.max": "Message must be at most 1000 characters long",
      "any.required": "Message content is required",
    }),
}); 