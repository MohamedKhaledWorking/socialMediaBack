import Joi from "joi";
import { validDomains } from "../Constant/constants.js";

export const generalValidationFields = {
  email: Joi.string()
    .email({
      minDomainSegments: 2,
      tlds: { allow: validDomains },
    })
    .pattern(/[^@ \t\r\n]+@[^@ \t\r\n]+\.[^@ \t\r\n]+/),
  password: Joi.string()
    .min(8)
    .max(90)
    .pattern(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$ %^&*-]).{8,}$/),
  confirmPassword: Joi.string().valid(Joi.ref("password")),
  username: Joi.string().min(3).max(30).required(),
  profileImage: Joi.string(),
  coverImage: Joi.string(),
  bio: Joi.string().max(500),
  phone: Joi.string().pattern(/^(002|\+2)?01[0125][0-9]{8}$/),
  address: Joi.string(),
  birthday: Joi.date(),
  gender: Joi.string().valid("male", "female"),
  role: Joi.string().valid("user", "admin"),
  isVerified: Joi.boolean(),
  authorization: Joi.string(),
};
