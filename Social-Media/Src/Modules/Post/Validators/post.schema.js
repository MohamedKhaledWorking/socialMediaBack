import Joi from "joi";
import { generalValidationFields } from "../../../Utils/generalValidationFields.utils.js";

export const createPostSchema = Joi.object().keys({
  content: Joi.string().max(5000).optional().messages({
    "string.max": "Content must be at most {#limit} characters long",
  }),
  media: Joi.array().items(Joi.string().uri()).optional().messages({
    "array.base": "Media must be an array",
    "string.uri": "Media URLs must be valid URLs",
  }),
  thumbnail: Joi.string().uri().optional().messages({
    "string.uri": "Thumbnail must be a valid URL",
  }),
  mood: Joi.string().max(50).optional().messages({
    "string.max": "Mood must be at most {#limit} characters long",
  }),
  tags: Joi.array().items(Joi.string().max(30)).optional().messages({
    "array.base": "Tags must be an array",
    "string.max": "Each tag must be at most {#limit} characters long",
  }),
  location: Joi.string().max(200).optional().messages({
    "string.max": "Location must be at most {#limit} characters long",
  }),
  privacy: Joi.string().valid("public", "friends", "private").default("public").messages({
    "string.valid": "Privacy must be 'public', 'friends', or 'private'",
  }),
  postType: Joi.string().valid("text", "image", "video", "audio", "poll", "link").default("text").messages({
    "string.valid": "Post type must be 'text', 'image', 'video', 'audio', 'poll', or 'link'",
  }),
  expiresAt: Joi.date().greater('now').optional().messages({
    "date.base": "Expiration date must be a valid date",
    "date.greater": "Expiration date must be in the future",
  }),
  authorization: generalValidationFields.authorization.required().messages({
    "any.required": "Authorization header is required",
    "string.pattern.base": "Authorization header must be in Bearer token format",
  }),
});

export const updatePostSchema = Joi.object().keys({
  postId: Joi.string().required(),
  content: Joi.string().max(5000).optional().messages({
    "string.max": "Content must be at most {#limit} characters long",
  }),
  media: Joi.array().items(Joi.string().uri()).optional().messages({
    "array.base": "Media must be an array",
    "string.uri": "Media URLs must be valid URLs",
  }),
  thumbnail: Joi.string().uri().optional().messages({
    "string.uri": "Thumbnail must be a valid URL",
  }),
  mood: Joi.string().max(50).optional().messages({
    "string.max": "Mood must be at most {#limit} characters long",
  }),
  tags: Joi.array().items(Joi.string().max(30)).optional().messages({
    "array.base": "Tags must be an array",
    "string.max": "Each tag must be at most {#limit} characters long",
  }),
  location: Joi.string().max(200).optional().messages({
    "string.max": "Location must be at most {#limit} characters long",
  }),
  privacy: Joi.string().valid("public", "friends", "private").optional().messages({
    "string.valid": "Privacy must be 'public', 'friends', or 'private'",
  }),
  postType: Joi.string().valid("text", "image", "video", "audio", "poll", "link").optional().messages({
    "string.valid": "Post type must be 'text', 'image', 'video', 'audio', 'poll', or 'link'",
  }),
  expiresAt: Joi.date().greater('now').optional().messages({
    "date.base": "Expiration date must be a valid date",
    "date.greater": "Expiration date must be in the future",
  }),
  authorization: generalValidationFields.authorization.required().messages({
    "any.required": "Authorization header is required",
    "string.pattern.base": "Authorization header must be in Bearer token format",
  }),
}); 