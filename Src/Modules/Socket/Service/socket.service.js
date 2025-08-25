import { socketConnections } from "../../../DB/Models/User.model.js";

export async function registerSocket(userId, socketId) {
  socketConnections.set(userId, socketId);
  console.log(socketConnections);
}

export async function unregisterSocket(userId) {
  socketConnections.delete(userId);
  console.log(socketConnections);
}
