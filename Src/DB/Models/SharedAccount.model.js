import mongoose, { Schema } from "mongoose";

const SharedAccountSchema = new Schema(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Owner ID is required"],
    },
    sharedWithId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Shared with user ID is required"],
    },
    permissions: {
      type: [String],
      enum: ["read", "write", "admin"],
      default: ["read"],
    },
    sharedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    expiresAt: {
      type: Date,
      // Optional: set expiration date for shared access
    },
  },
  { timestamps: true }
);

// Prevent duplicate shares
SharedAccountSchema.index(
  { ownerId: 1, sharedWithId: 1 },
  { unique: true }
);

// Check if share has expired
SharedAccountSchema.methods.isExpired = function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
};

export const SharedAccountModel =
  mongoose.models.SharedAccount || mongoose.model("SharedAccount", SharedAccountSchema); 