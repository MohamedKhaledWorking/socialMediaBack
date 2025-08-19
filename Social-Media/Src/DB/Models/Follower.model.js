import mongoose, { Schema } from "mongoose";

const FollowerSchema = new Schema({
    follower: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    following: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  }, { timestamps: true });

  export const FollowerModel = mongoose.models.Follower || mongoose.model('Follower', FollowerSchema);