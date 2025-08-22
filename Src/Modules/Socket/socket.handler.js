import { initializeMessageHandlers } from "./handlers/message.handler.js";
import { initializeNotificationHandlers } from "./handlers/notification.handler.js";

// Rate limiting map to prevent spam
const rateLimitMap = new Map();

// Rate limiting function
const checkRateLimit = (socket, event, limit = 5, windowMs = 60000) => {
  const key = `${socket.userId}_${event}`;
  const now = Date.now();
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  const record = rateLimitMap.get(key);
  
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + windowMs;
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
};

// Initialize all socket handlers
export const initializeSocketHandlers = (io, socket) => {
  // Initialize message handlers
  initializeMessageHandlers(io, socket, checkRateLimit);
  
  // Initialize notification handlers
  initializeNotificationHandlers(io, socket, checkRateLimit);
  
  // Handle typing events
  socket.on("typing_start", (data) => {
    if (!checkRateLimit(socket, "typing_start", 10, 30000)) {
      return socket.emit("error", { message: "Rate limit exceeded for typing events" });
    }
    
    const { receiverId } = data;
    if (receiverId && receiverId !== socket.userId) {
      socket.to(`user_${receiverId}`).emit("user_typing", {
        userId: socket.userId,
        username: socket.user.username,
      });
    }
  });
  
  socket.on("typing_stop", (data) => {
    const { receiverId } = data;
    if (receiverId && receiverId !== socket.userId) {
      socket.to(`user_${receiverId}`).emit("user_stopped_typing", {
        userId: socket.userId,
      });
    }
  });
  
  // Handle online/offline status
  socket.on("set_status", (data) => {
    if (!checkRateLimit(socket, "set_status", 3, 60000)) {
      return socket.emit("error", { message: "Rate limit exceeded for status updates" });
    }
    
    const { status } = data;
    // Broadcast status change to followers
    socket.broadcast.emit("user_status_change", {
      userId: socket.userId,
      status,
    });
  });
}; 