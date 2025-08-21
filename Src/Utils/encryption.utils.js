import jwt from "jsonwebtoken";
import CryptoJS from "crypto-js";

const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || "15m";
const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET || "dev_access_secret_change_me";

export const encrypt = (value, key) => {
  const encryptedData = CryptoJS.AES.encrypt(value, key).toString();
  return encryptedData;
};

export const decrypt = (value, key) => {
  const data = CryptoJS.AES.decrypt(value, key);
  const decryptedData = data.toString(CryptoJS.enc.Utf8);
  return decryptedData;
};

export function signAccessToken(user) {
  const payload = { sub: user._id.toString(), email: user.email };
  return jwt.sign(payload, JWT_ACCESS_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES_IN,
  });
}

export function verifyAccessToken(token , key) {
  return jwt.verify(token, key);
}
