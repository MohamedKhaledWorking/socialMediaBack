import express from "express";
import dotenv from "dotenv";
import path from "node:path";
import database_connection from "./DB/connection.js";
import cors from "cors";
import { authRoutes } from "./Modules/Auth/auth.controller.js";
import { userRoutes } from "./Modules/User/user.controller.js";
import { postRoutes } from "./Modules/Post/post.controller.js";
import { reactionRoutes } from "./Modules/Reactions/Reaction.controller.js";
import { savedPostsRoutes } from "./Modules/SavedPosts/savedPosts.controller.js";
import { friendRoutes } from "./Modules/Friend/friend.controller.js";
import { followRoutes } from "./Modules/Follow/follow.controller.js";
import { searchRoutes } from "./Modules/Search/search.controller.js";
import { storiesRoutes } from "./Modules/Stories/stories.controller.js";
import { messageRoutes } from "./Modules/Message/message.controller.js";
import { notificationRoutes } from "./Modules/Notification/notification.controller.js";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config({ path: path.resolve("Src/Config/.env.dev") });

const app = express();
const PORT = process.env.PORT;

const server = createServer(app);

app.use(cors());
app.use(express.json());

// Basic root route
app.get("/", (req, res) => {
  res.send(`API running on http://localhost:${PORT}`);
});

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/reaction", reactionRoutes);
app.use("/api/savedPost", savedPostsRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/savedPosts", savedPostsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/stories", storiesRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);

// Initialize Socket.IO with CORS
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    // origin : "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO authentication middleware
io.use(async (socket, next) => {
  try {
    const token =
      socket.handshake.auth.token || socket.handshake.headers.authorization;
    if (!token) {
      return next(new Error("Authentication error: No token provided"));
    }

    const { verifyToken } = await import(
      "./Modules/Auth/Services/auth.service.js"
    );
    const decoded = await verifyToken(token.replace("Bearer ", ""));

    if (!decoded) {
      return next(new Error("Authentication error: Invalid token"));
    }

    socket.userId = decoded._id;
    socket.user = decoded;
    next();
  } catch (error) {
    next(new Error("Authentication error: " + error.message));
  }
});

// Socket.IO connection handler
io.on("connection", async (socket) => {
  console.log(`User ${socket.userId} connected`);

  try {
    // Update user's online status
    const { UserModel } = await import("./DB/Models/User.model.js");
    await UserModel.findByIdAndUpdate(socket.userId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    // Join user to their personal room
    socket.join(`user_${socket.userId}`);

    // Broadcast online status to followers
    socket.broadcast.emit("user_status_change", {
      userId: socket.userId,
      status: "online",
      timestamp: new Date(),
    });

    // Handle disconnection
    socket.on("disconnect", async () => {
      console.log(`User ${socket.userId} disconnected`);

      try {
        // Update user's offline status
        await UserModel.findByIdAndUpdate(socket.userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        // Broadcast offline status to followers
        socket.broadcast.emit("user_status_change", {
          userId: socket.userId,
          status: "offline",
          lastSeen: new Date(),
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Error updating offline status:", error);
      }
    });

    // Import and initialize socket handlers
    import("./Modules/Socket/socket.handler.js").then(
      ({ initializeSocketHandlers }) => {
        initializeSocketHandlers(io, socket);
      }
    );
  } catch (error) {
    console.error("Error handling socket connection:", error);
    socket.disconnect();
  }
});

// Set Socket.IO instance in services that need it
import("./Modules/Message/Services/message.service.js").then(
  ({ setSocketIO }) => {
    setSocketIO(io);
  }
);

// import("./Modules/Reactions/services/reaction.service.js").then(
//   ({ setSocketIO }) => {
//     setSocketIO(io);
//   }
// );

// import("./Modules/Follow/Services/follow.service.js").then(
//   ({ setSocketIO }) => {
//     setSocketIO(io);
//   }
// );

const bootstrapFunction = () => {
  database_connection();
  server
    .listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
      console.log(`Socket.IO server is running on port ${PORT}`);
    })
    .on("error", (err) => {
      console.log(`something went wrong on running server  ${err}`);
    });
};

export default bootstrapFunction;
