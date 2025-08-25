import mongoose, { Schema } from "mongoose";

const MessageSchema = new Schema(
  {
    sender: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiver: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    content: { type: String, required: true },

    isRead: { type: Boolean, default: false }, // receiver only
    readAt: { type: Date },

    isEdited: { type: Boolean, default: false },
    editedAt: { type: Date },

    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export const MessageModel =
  mongoose.models.Message || mongoose.model("Message", MessageSchema);
