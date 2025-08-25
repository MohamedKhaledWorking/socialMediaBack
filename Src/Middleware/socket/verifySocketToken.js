// Src/Socket/verifySocketToken.js
import jwt from "jsonwebtoken";

export function verifySocketToken(socket, next) {
  try {
    // 1) read token from `auth.token` OR `Authorization` header
    let raw =
      socket.handshake?.auth?.token ||
      socket.handshake?.headers?.authorization ||
      "";

    if (!raw) return next(new Error("unauthorized:no_token"));

    // 2) normalize: remove "Bearer " and whitespace/newlines
    raw = String(raw).trim();
    if (raw.startsWith("Bearer ")) raw = raw.slice(7);
    raw = raw.replace(/\s+/g, ""); // collapse any accidental newlines

    // 3) verify using your signing secret
    const secret = process.env.JWT_SECRET;
    if (!secret) return next(new Error("unauthorized:no_server_secret"));

    const payload = jwt.verify(raw, secret); // will throw on invalid/expired
    socket.user = payload;                   // attach user to socket for later
    return next();
  } catch (err) {
    // Surface the exact reason to the client to debug quickly
    console.error("Socket JWT verify failed:", err.name, err.message);
    return next(new Error(`unauthorized:${err.name}`)); // e.g. unauthorized:TokenExpiredError
  }
}

export default verifySocketToken;
