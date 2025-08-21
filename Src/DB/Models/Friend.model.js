import mongoose, { Schema }  from "mongoose";

const FriendSchema = new mongoose.Schema({
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  friendId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  status: {
    type: Boolean,
    default: false,
  },
});

export const FriendModel =
  mongoose.models.Friend || mongoose.model("Friend", FriendSchema);
