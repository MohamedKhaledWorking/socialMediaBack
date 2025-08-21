import mongoose, { Schema } from "mongoose";

const NotificationSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: [
      "new_reaction",
      "new_follow",
      "follow_accepted",
      "new_message",
      "new_comment",
      "post_liked",
      "mention",
      "system"
    ],
    required: true,
  },
  fromUser: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false, // Not required for system notifications
  },
  postId: {
    type: Schema.Types.ObjectId,
    ref: "Post",
    required: false,
  },
  message: {
    type: String,
    required: true,
    maxlength: [500, "Message must be at most 500 characters long"],
  },
  isRead: {
    type: Boolean,
    default: false,
    index: true,
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: {},
  },
}, { timestamps: true });

// Compound indexes for efficient queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

export const NotificationModel = mongoose.models.Notification || mongoose.model("Notification", NotificationSchema); 