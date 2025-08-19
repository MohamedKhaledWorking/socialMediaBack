import { generalValidationFields } from "../../../Utils/generalValidationFields.utils.js";
import Joi from "joi";

export const signUpSchema = Joi.object().keys({
  email: generalValidationFields.email
    .required()
    .messages({
      "string.email": "Invalid email format",
      "any.required": "Email is required",
    })
    .pattern(/[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/),
  password: generalValidationFields.password.required().messages({
    "string.min": "Password must be at least {#limit} characters long",
    "string.max": "Password must be at most {#limit} characters long",
    "any.required": "Password is required",
    "string.pattern.base":
      "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
  }),
  confirmPassword: generalValidationFields.confirmPassword.required().messages({
    "any.only": "Passwords do not match",
    "any.required": "Confirm Password is required",
  }),
  username: generalValidationFields.username.required().messages({
    "string.min": "Username must be at least {#limit} characters long",
    "string.max": "Username must be at most {#limit} characters long",
    "any.required": "Username is required",
  }),
  profileImage: generalValidationFields.profileImage.messages({
    "string.uri": "Profile image must be a valid URL",
  }),
  coverImage: generalValidationFields.coverImage.messages({
    "string.uri": "Cover image must be a valid URL",
  }),
  bio: generalValidationFields.bio.messages({
    "string.max": "Bio must be at most {#limit} characters long",
  }),
  phone: generalValidationFields.phone.messages({
    "string.pattern.base":
      "Phone number must be in the format 01012345678 or +201012345678",
  }),
  address: generalValidationFields.address.messages({
    "string.empty": "Address cannot be empty",
  }),
  birthday: generalValidationFields.birthday.messages({
    "date.base": "Birthday must be a valid date",
  }),
  gender: generalValidationFields.gender.messages({
    "string.valid": "Gender must be 'male' or 'female'",
  }),
});

export const loginSchema = Joi.object().keys({
  email: generalValidationFields.email.required().messages({
    "string.email": "Invalid email format",
    "any.required": "Email is required",
  }),
  password: generalValidationFields.password.required().messages({
    "any.required": "Password is required",
  }),
});

export const verifyEmailSchema = Joi.object().keys({
  email: generalValidationFields.email.required().messages({
    "string.email": "Invalid email format",
    "any.required": "Email is required",
  }),
  otp: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.pattern.base": "OTP must be a 6-digit number",
      "any.required": "OTP is required",
    }),
});

export const forgetPasswordSchema = Joi.object().keys({
  email: generalValidationFields.email.required().messages({
    "string.email": "Invalid email format",
    "any.required": "Email is required",
  }),
});

export const resetPasswordSchema = Joi.object().keys({
  email: generalValidationFields.email.required().messages({
    "string.email": "Invalid email format",
    "any.required": "Email is required",
  }),
  otp: Joi.string()
    .pattern(/^\d{6}$/)
    .required()
    .messages({
      "string.pattern.base": "OTP must be a 6-digit number",
      "any.required": "OTP is required",
    }),
  password: generalValidationFields.password.required().messages({
    "any.required": "New password is required",
    "string.min": "New password must be at least {#limit} characters long",
    "string.max": "New password must be at most {#limit} characters long",
    "string.pattern.base":
      "New password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
  }),
  confirmPassword: generalValidationFields.confirmPassword.required().messages({
    "any.only": "Passwords do not match",
    "any.required": "Confirm new password is required",
  }),
});
