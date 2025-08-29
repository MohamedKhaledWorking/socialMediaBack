import jwt from "jsonwebtoken";
import { UserModel } from "../../../DB/Models/User.model.js";
import { encrypt } from "../../../Utils/encryption.utils.js";
import bcrypt from "bcryptjs";
import { sendEmail } from "../../../Utils/sendEmail.utils.js";
import { randomInt } from "crypto";
import { emailTemplate } from "../../../EmailTemplate.js";
import { addToBlacklist } from "../../../Utils/tokenBlacklist.utils.js";

export const registerController = async (req, res) => {
  const data = req.body;

  const isUserExist = await UserModel.findOne({ email: data.email });
  if (isUserExist) {
    return res.status(409).json({ message: "Email already in use" });
  }

  const hashedPassword = bcrypt.hashSync(
    data.password,
    Number(process.env.SALT)
  );

  const encryptedPhone = encrypt(data.phone, process.env.PHONE_ENCRYPTION_KEY);
  const encryptedAddress = encrypt(
    data.address,
    process.env.ADDRESS_ENCRYPTION_KEY
  );
  const otp = randomInt(100000, 1000000);
  const hashedOtp = bcrypt.hashSync(
    otp.toString(),
    Number(process.env.OTP_ENCRYPTION_KEY)
  );
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  sendEmail({
    to: data.email,
    subject: "Welcome to SocialUs",
    text: `Hello ${data.username}, welcome to SocialUs!`,
    html: emailTemplate({
      name: data.username,
      otp,
      validFor: "5 minutes",
      operation: "verify your email",
    }),
  });

  await UserModel.create({
    ...data,
    password: hashedPassword,
    phone: encryptedPhone,
    address: encryptedAddress,
    otp: hashedOtp,
    otpExpires,
  });

  res.status(201).json({
    status: "success",
    message: "Registration successful please check your email",
  });
};

export const loginController = async (req, res) => {
  const { email, password } = req.body;

  const user = await UserModel.findOne({ email }).select(
    "-otp -otpExpires  -coverImage "
  );
  if (!user) {
    return res
      .status(404)
      .json({ status: "failure", message: "Email or password are invalid" });
  }

  const isMatch = bcrypt.compareSync(password, user.password);
  if (!isMatch) {
    return res
      .status(404)
      .json({ status: "failure", message: "Email or password are invalid" });
  }

  if (!user.isVerified) {
    return res
      .status(403)
      .json({ status: "failure", message: "Please verify your account first" });
  }
  if (user.isDeleted) {
    return res
      .status(403)
      .json({ status: "failure", message: "Account is deactivated" });
  }
  if (user.isBanned) {
    return res
      .status(403)
      .json({ status: "failure", message: "Account is banned" });
  }

  const accessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "2h" }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET,
    {
      expiresIn: "7d",
    }
  );

  res.status(200).json({
    status: "success",
    message: "Login successful",
    accessToken,
    refreshToken,
    user,
  });
};

export const verifyEmail = async (req, res) => {
  const { email, otp } = req.body;

  const user = await UserModel.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isMatch = bcrypt.compareSync(otp, user.otp);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (user.otpExpires < new Date()) {
    return res.status(400).json({ message: "OTP has expired" });
  }

  user.isVerified = true;
  user.otp = null;
  user.otpExpires = null;
  await user.save();

  res
    .status(200)
    .json({ status: "success", message: "Email verified successfully" });
};

export const forgetPassword = async (req, res) => {
  const { email } = req.body;

  const user = await UserModel.findOne({ email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const otp = randomInt(100000, 1000000);
  const hashedOtp = bcrypt.hashSync(
    otp.toString(),
    Number(process.env.OTP_ENCRYPTION_KEY)
  );
  const otpExpires = new Date(Date.now() + 5 * 60 * 1000);

  user.otp = hashedOtp;
  user.otpExpires = otpExpires;
  await user.save();

  sendEmail({
    to: email,
    subject: "Reset Password",
    text: `Hello ${user.username}, please use the following OTP to reset your password: ${otp}`,
    html: emailTemplate({
      name: user.username,
      otp,
      validFor: "5 minutes",
      operation: "reset your password",
    }),
  });
  res.status(200).json({
    message: "OTP sent to your email",
  });
};

export const resetPassword = async (req, res) => {
  const data = req.body;

  const user = await UserModel.findOne({ email: data.email });
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const isMatch = bcrypt.compareSync(data.otp, user.otp);
  if (!isMatch) {
    return res.status(400).json({ message: "Invalid OTP" });
  }

  if (user.otpExpires < new Date()) {
    return res.status(400).json({ message: "OTP has expired" });
  }
  const hashedPassword = bcrypt.hashSync(
    data.password,
    Number(process.env.SALT)
  );
  user.password = hashedPassword;
  user.otp = null;
  user.otpExpires = null;
  await user.save();
  res.status(200).json({ message: "Password reset successfully" });
};

export const logoutController = async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  let token = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.substring(7);
  }

  // If token exists, add it to blacklist
  if (token) {
    addToBlacklist(token);
    console.log("Token blacklisted successfully");
  }

  // Clear cookies
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.clearCookie("userToken");

  // Send success response
  res.status(200).json({
    message: "Logout successful",
    success: true,
  });
};
