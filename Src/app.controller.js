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
import { messageRoutes } from "./Modules/Messages/message.controller.js";
import { Server } from "socket.io";

dotenv.config({ path: path.resolve("Src/Config/.env.dev") });

const app = express();
const PORT = process.env.PORT;

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

const bootstrapFunction = () => {
  database_connection();
  const server = app
    .listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    })
    .on("error", (err) => {
      console.log(`something went wrong on running server  ${err}`);
    });

  const io = new Server(server, { cors: { origin: "*" } });
  io.on("connection", (socket) => {
    console.log("A user connected");

    console.log(socket);

    console.log("*".repeat(50));

    socket.emit("test:hello", { msg: "connected", id: socket.id });

    // echo back whatever you send
    socket.on("test:echo", (data) => {
      console.log(data);
      socket.emit("test:echo", { youSent: data, from: socket.id });
    });

    socket.on("send_message" , (data) => {
      console.log(data);
    })

    // ping -> ack (tests acknowledgements)
    socket.on("test:ping", (data, ack) => {
      console.log("PING", data);
      ack?.({ pong: true, at: Date.now() });
    });

    // broadcast (you can trigger this from any client later)
    socket.on("test:broadcast", (data) => {
      console.log(data);
      socket.broadcast.emit("test:broadcast", { from: socket.id, ...data });
    });
  });
};

export default bootstrapFunction;
