import Joi from "joi";
import { generalValidationFields } from "../../../Utils/generalValidationFields.utils.js";

export const createUserSchema = Joi.object().keys({
  username: generalValidationFields.username.required().messages({
    "string.empty": "Username is required",
    "string.min": "Username must be at least {#limit}characters long",
    "string.max": "Username must be at most {#limit} characters long",
  }),
  email: generalValidationFields.email.required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address",
  }),
  password: generalValidationFields.password.required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least {#limit} characters long",
    "string.max": "Password must be at most {#limit} characters long",
    "string.pattern.base":
      "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
  }),
  confirmPassword: generalValidationFields.confirmPassword.required().messages({
    "any.only": "Confirm Password must match Password",
    "any.required": "Confirm Password is required",
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
  role: generalValidationFields.role.required().messages({
    "string.empty": "Role is required",
    "string.valid": "Role must be 'user' or 'admin'",
  }),
  isVerified: generalValidationFields.isVerified.messages({
    "boolean.base": "isVerified must be a boolean value",
  }),
  authorization: generalValidationFields.authorization.required().messages({
    "any.required": "Authorization header is required",
    "string.pattern.base":
      "Authorization header must be in Bearer token format",
  }),
});

export const updateUserSchema = Joi.object().keys({
  username: generalValidationFields.username.messages({
    "string.min": "Username must be at least {#limit}characters long",
    "string.max": "Username must be at most {#limit} characters long",
  }),
  profileImage: generalValidationFields.profileImage.messages({
    "string.uri": "Profile image must be a valid URL",
  }),
  coverImage: generalValidationFields.coverImage.messages({
    "string.uri": "Cover image must be a valid URL",
  }),
  profileImageId: Joi.string().messages({
    "string.uri": "Profile image id must be a string",
  }),
  coverImageId: Joi.string().messages({
    "string.uri": "Cover image id must be a string",
  }),
  bio: generalValidationFields.bio.messages({
    "string.max": "Bio must be at most {#limit} characters long",
  }),
  phone: generalValidationFields.phone.messages({
    "string.pattern.base":
      "Phone number must be in the format 01012345678 or +201012345678",
  }),
  address: generalValidationFields.address.empty(""),
  birthday: generalValidationFields.birthday.messages({
    "date.base": "Birthday must be a valid date",
  }),
  authorization: generalValidationFields.authorization.messages({
    "any.required": "Authorization header is required",
    "string.pattern.base":
      "Authorization header must be in Bearer token format",
  }),
  status  : generalValidationFields.status.messages({
    "string.valid": "Status must be 'active', 'inactive', or 'frozen'",
  }),
  socialLinks: Joi.object().keys({
    facebook: Joi.string().messages({
      "string.uri": "Facebook link must be a valid URL",
    }),
    instagram: Joi.string().messages({
      "string.uri": "Instagram link must be a valid URL",
    }),
    twitter: Joi.string().messages({
      "string.uri": "Twitter link must be a valid URL",
    }),
    linkedin: Joi.string().messages({
      "string.uri": "LinkedIn link must be a valid URL",
    }),
  })
});

export const updateUserPasswordSchema = Joi.object().keys({
  oldPassword: generalValidationFields.password.required().messages({
    "any.required": "Old password is required",
    "string.min": "Old password must be at least {#limit} characters long",
    "string.max": "Old password must be at most {#limit} characters long",
    "string.pattern.base":
      "Old password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
  }),
  password: generalValidationFields.password
    .required()
    .not(Joi.ref("oldPassword"))
    .messages({
      "any.required": "New password is required",
      "string.min": "New password must be at least {#limit} characters long",
      "string.max": "New password must be at most {#limit} characters long",
      "string.pattern.base":
        "New password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
      "any.invalid": "New password must be different from old password",
    }),
  confirmPassword: generalValidationFields.confirmPassword.required().messages({
    "any.only": "Confirm Password must match Password",
    "any.required": "Confirm Password is required",
  }),
  authorization: generalValidationFields.authorization.required().messages({
    "any.required": "Authorization header is required",
    "string.pattern.base":
      "Authorization header must be in Bearer token format",
  }),
});

export const freezeAccountSchema = Joi.object().keys({
  authorization: generalValidationFields.authorization.required().messages({
    "any.required": "Authorization header is required",
    "string.pattern.base":
      "Authorization header must be in Bearer token format",
  }),
});

export const activateAccountSchema = Joi.object().keys({
  email: generalValidationFields.email.required().messages({
    "string.empty": "Email is required",
    "string.email": "Email must be a valid email address",
  }),
  password: generalValidationFields.password.required().messages({
    "string.empty": "Password is required",
    "string.min": "Password must be at least {#limit} characters long",
    "string.max": "Password must be at most {#limit} characters long",
    "string.pattern.base":
      "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character",
  }),
});
