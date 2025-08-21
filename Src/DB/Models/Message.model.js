import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false },
    seenBy: [{ 
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      seenAt: { type: Date, default: Date.now }
    }],
  },
  { timestamps: true }
);

export const MessageModel =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);
