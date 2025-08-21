import Joi from "joi";

export const FriendSchema = Joi.object().keys({
    friendId: Joi.string().required().length(24).hex().messages({
        "string.empty": "Friend ID is required",
        "any.required": "Friend ID is required",
        "string.length": "Friend ID must be 24 characters long",
        "string.hex": "Friend ID must be a valid MongoDB Object ID",
    }),
    authorization: Joi.string().required().messages({
        "any.required": "Authorization header is required",
        "string.pattern.base":
            "Authorization header must be in Bearer token format",
    }),
});