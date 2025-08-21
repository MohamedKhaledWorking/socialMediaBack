import e from "express";
import { UserModel } from "../DB/Models/User.model.js";
import { verifyAccessToken } from "../Utils/encryption.utils.js";
import { isTokenBlacklisted } from "../Utils/tokenBlacklist.utils.js";

export async function authMiddleware(req, res, next) {
  try {
    const header = req.headers.authorization;
    const [type, token] = header.split(" ");
    let signature = "";

    if (type == "Bearer") {
      signature = process.env.JWT_ACCESS_SECRET;
    } else if (type == "admin") {
      signature = process.env.ADMIN_JWT_ACCESS_SECRET;
    } else {
      return res
        .status(401)
        .json({ status: "failure", error: "Unauthorized", message: "Invalid token formate" });
    }

    // Check if token is blacklisted
    if (isTokenBlacklisted(token)) {
      return res
        .status(401)
        .json({status: "failure", error: "Unauthorized", message: "Token has been revoked" });
    }

    const decoded = verifyAccessToken(token, signature);
    const user = await UserModel.findById(decoded.id).select(
      "-otp -__v -createdAt -updatedAt -otpExpires -isVerified"
    );
    if (!user) {
      return res.status(404).json({status: "failure",  error: "User not found" });
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "Invalid token" });
    } else if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ error: "Unauthorized", message: "Token expired" });
    }
    return res.status(500).json({
      error: "internal server error",
      message: err.message,
      stack: process.env.MOOD === "production" ? null : err.stack,
    });
  }
}
