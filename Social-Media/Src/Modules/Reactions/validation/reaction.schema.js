import Joi from "joi";
import { REACTION_KINDS } from "../../../Constant/constants.js";
import { generalValidationFields } from "../../../Utils/generalValidationFields.utils.js";

export const createReactionSchema = Joi.object().keys({
  postId: Joi.string().required().length(24).hex().messages({
    "string.empty": "Post ID is required",
    "any.required": "Post ID is required",
    "string.length": "Post ID must be 24 characters long",
    "string.hex": "Post ID must be a valid MongoDB Object ID",
  }),
  authorization: generalValidationFields.authorization.required().messages({
    "any.required": "Authorization header is required",
    "string.pattern.base":
      "Authorization header must be in Bearer token format",
  }),
  type: Joi.string().valid(...REACTION_KINDS).required().messages({
    "string.empty": "Reaction type is required",
    "any.required": "Reaction type is required",
    "string.valid": `Reaction type must be one of ${REACTION_KINDS.join(", ")}`,
  }),
});
